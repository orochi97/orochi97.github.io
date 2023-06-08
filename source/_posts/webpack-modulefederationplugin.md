---
title: 用 webpack ModuleFederationPlugin 搭建微前端
date: 2023-06-07 10:34:33
categories:
- 开发
- 前端
tags:
- 工程化
---

webpack5 推出了一个 [ModuleFederationPlugin](https://webpack.docschina.org/plugins/module-federation-plugin/)，“模块联邦插件”。名字上就有点微前端的意思。网上的介绍原理什么的这里就不说了，就从实际的使用来看，它的作用有：

1. 把本工程的一些内容单独打包成文件分享出去。
2. 使用别的工程分享出来的文件。

用法其实也很简单，就一个插件而已，但是要实现到微前端落地还是有很多要改造的。基于此用 **vue** 工程做了个尝试案例，并对其中一些注意点做一些说明。

代码压缩包：[micro-fontends.tar.gz](https://file.cchealthier.com/file/blog/attachment/micro-fontends.tar.gz)

**注意：代码里的 heal.com 网站，是我自己修改了 host，Mac 可以在 `/etc/hosts`，Windows 可以在 `C:\Windows\System32\drivers\etc\hosts` 文件里添加这一行或者改成自己喜欢的域名：`0.0.0.0 heal.com`。**

## 一、基础用法

```js
new ModuleFederationPlugin({
  name: 'admin',
  filename: 'remoteEntry.js',
  remotes: {
    workforce: 'workforce@http://heal.com/workforce/remoteEntry.js',
    network: 'network@http://heal.com/network/remoteEntry.js',
  },
  exposes: {
    './init': './src/main.js',
    './layout': './src/components/Layout.vue',
  },
}),
```

- **name:** 这个工程的模块名，比如这里是主应用，把它叫做 `admin`。 
- **filename:** 这个工程分享的文件入口，也就是别的工程只需要应用这份入口文件就可以了，其他的文件会在这份文件里发出请求。
- **remotes:** 使用其他工程的文件，比如使用了两个子应用 `workforce` 和 `network` 的东西，可以看到引用的就是 `remoteEntry.js`。
- **exposes:** 这个工程分享的具体内容，照着格式写就好了，注意 key 值是相对路径写法。

代码里的使用是使用 `import()` 异步动态引入的方式：`import('admin/layout')`。引用内容格式为 `import('模块名/exposes的key值')`。这也是个 promise，在 then 的回调里接收导出值即可。

## 二、用于微前端

使用方法看起来，是可以导出单个文件，也可以导出入口文件，让其牵出一模块代码。代码很简单，就这么一个用法。但是用于微前端的搭建还需要考虑：

- 主子应用的引入。主应用也就是基座，必然由它来引用子应用的东西，然后来启动项目。那么子应用暴露什么出来好？
- 开发问题。本地开发怎么启动，不能我开发子应用还要启动主应用吧？反过来开发主应用难道必须启动所有子应用？那还不如不拆。
- 还是开发问题。上面那个的相反，假设现在已经达到每次只需要启动要修改的项目就好了。但是肯定会出现一个功能要同时修改主子应用的，主子项目如何联调开发。
- 部署时的代理配置。主子应用已经是不同项目了，当然也是用不同容器承载。但是域名必须是同一个，怎么配置好代理转发可以正常访问到想要的资源？

那么一个个来看。

<!-- more -->

### 1、子应用暴露路由块给主应用引入

子应用的路由声明，最上层用模块名 `/network` 做命名空间，为了统一命名空间。主应用也分配一个 `/admin` 的路径，不要只使用根路径 `/`。
```js
export const routes = [{
  path: '/network',
  name: 'network',
  redirect: '/network/home',
  component: () => import('admin/layout'),
  children: [
    {
      path: 'home',
      name: 'networkHome',
      component: () => import('@/views/Home.vue'),
    },
    { ... },
    {
      path: '*',
      redirect: '/network/home',
    },
  ],
}];
```

而对于`子应用`的 webpack 插件配置为：
```js
new ModuleFederationPlugin({
  name: 'network',
  filename: 'remoteEntry.js',
  remotes: {
    admin: 'admin@http://heal.com/admin/remoteEntry.js',
  },
  exposes: {
    './router': './src/router/index.js',
  },
})
```

而对于`主应用`的引入做法：
```js
// router/index.js
export async function genRouter() {
  try {
    let _routes = [];

    const modules = await Promise.all([
      import('workforce/router'),
      import('network/router'),
    ]);
    modules.forEach((mod) => {
      _routes = mod.routes.concat(_routes);
    });
    _routes = _routes.concat(routes);

    const router = new VueRouter({
      mode: 'history',
      routes: _routes,
    });
    return router;
  } catch (error) {
    console.error('load router fail', error);
    return [];
  }
}

// main.js
import { genRouter } from './router';
export function init() {
  Promise.all([genRouter()]).then(([router]) => {
    new Vue({
      router,
      render: (h) => h(App),
    }).$mount('#app');
  });
}

init();
```

由于引用外部文件是异步加载，所以这里 vue 的实例初始化也要变成异步处理。然后为啥是个方法执行，因为要**暴露出这个实例初始化方法，给子应用开发时调用**。

### 2、开发只需要启动要修改的项目

首先假设这个微前端落地上线了。
那么对于不改动到的项目，我们直接用线上那部分的就可以了。反正代码也不改，不需要启动。主应用的启动依然如上图所示。

`子应用`启动做法为：
```js
// main.js
function init() {
  Promise.all([import('admin/init')])
    .then(([adminModule]) => {
      adminModule.init();
    })
    .catch((error) => {
      console.error('init error', error);
    });
}

init();
```
引用了线上主应用的启动方法来启动。然后修改代码即可热更新该子应用的路由页面。

这里有个细节点：
----------

**引用的是线上主应用 init 方法 -> 来自线上主应用的 remoteEntry.js -> 用的是线上主应用的 genRouter 方法 -> 加载的是线上两个子应用的 remoteEntry.js 导出的路由文件**。
那么这条链路怎么看都没有涉及到本地文件，怎么能起到开发也就是本地文件生效的作用呢？

稍微看了 debug 下代码，可能是：webpack 在加载 script 标签后，都是把加载后的模块代码存在全局的一份 cache 里（有兴趣可看看这篇文章《[webpack通过webpackJsonp来连接多文件依赖](/2020/08/16/webpackJsonp/)》）。经由 ModuleFederationPlugin 插件处理的 js 文件的模块名应该都是固定唯一的，比如 cache 的 key 值为 `webpack/container/remote/network/router`、`webpack/container/remote/workforce/router`。那就是有可能是开发时候的 `开发模块js` 属于最后加载，把全局的 webpack cache 里内容给更新了。所以把本来是加载线上的子应用 remoteEntry.js，变成是加载本地开发的 remoteEntry.js 了。

----------

### 3、同时启动主应用和子应用本地开发

相比之下，这个问题就好解决多了。只要在启动的时候，把指向线上的引用地址改为本地的即可。以主应用为例：
```js
const getModuleRemotes = () => {
  let workforceRemote = 'workforce@http://heal.com/workforce/remoteEntry.js';
  if (process.env.WORKFORCE_APP) {
    workforceRemote = `workforce@http://${process.env.WORKFORCE_APP}/remoteEntry.js`;
  }

  let networkRemote = 'network@http://heal.com/network/remoteEntry.js';
  if (process.env.NETWORK_APP) {
    networkRemote = `network@http://${process.env.NETWORK_APP}/remoteEntry.js`;
  }
  return {
    workforce: workforceRemote,
    network: networkRemote,
  };
};
```
启动的时候加参数即可：`WORKFORCE_APP=localhost:3000 NETWORK_APP=localhost:4000 npm run dev`。当然记得同时要启动子应用。

### 4、代理配置

我这里用 nginx 做的服务，其他的应该转发规则的声明也是大同小异吧。关于 nginx 的配置可以看看《[nginx 的基础用法 & linux（centos）下支持 https 和 http2](/2023/04/21/nginx-basic/)》、《[记录下 nginx 使用配置](/2022/03/26/nginx/)》。

```yml
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;

    keepalive_timeout  65;

    gzip  on;
    gzip_comp_level  6;    # 压缩比例，比例越大，压缩时间越长。默认是1
    gzip_types    text/xml text/plain text/css application/javascript application/x-javascript application/rss+xml;     # 哪些文件可以被压缩

    server {
        listen       80;
        server_name  heal.com;

        index  index.html index.htm;

        location ~* ^\/workforce/.+\.(js|css)$ {
            root   /Users/cchealthier/Projects/micro-fontends/packages/workforce/dist;
        }
        location ~* ^\/network/.+\.(js|css)$ {
            root   /Users/cchealthier/Projects/micro-fontends/packages/network/dist;
        }
        location ~ ^\/* {
            root   /Users/cchealthier/Projects/micro-fontends/packages/admin/dist;
            try_files $uri $uri/ /admin/index.html;
        }
    }

    include servers/*;
}
```
主要是下面几个 `location` 的写法：
1. 用正则匹配子应用的文件资源，比如 js css 文件，有别的文件格式则继续添加后缀。让它们打到相应子应用的容器里去访问。
2. 接下来统统访问主应用容器。因为使用主应用做基座，也就是用主应用的 index.html 做 html。所以剩余的全部只需要访问主应用容器即可。最后再添加兜底访问主应用的 index.html 文件。以便各式路由都能有东西返回。

### 4、webpack 配置注意点

```js
output: {
  path: resolve(cwd, `dist/${appName}`),
  publicPath: isDev ? `${devUrl}/` : `http://heal.com/${appName}/`,
  filename: '[name].js', // 打包后输出文件的文件名
}
```

**path：**
上面可以看出，为了各个子应用的命名空间。所以在打包输出里做多了一层文件夹：
也就是输出的 `dist` 文件夹里还有一层 `admin`/`workforce`/`network` 文件夹，里面才是正式产物。这样在访问的时候 url 就会带上模块命命名空间。

**publicPath：**
这个也是很重要。它决定了打包进代码里，对于资源文件的 url 请求。
1. 没值的时候，文件路径是 `xxx.js`，会拼接上当前的网站 url。比如在 `http://heal.com/workforce` 页面会请求 `http://heal.com/workforce/xxx.js`。
2. 写成 `/`，文件路径是 `/xxx.js`，那么无论在什么时候都是当前域名加这个路径。也就是在 `http://heal.com/workforce` 页面也是请求 `http://heal.com/xxx.js`。
3. 通常配置成 `/` 就没问题了。但是呢，在使用 ModuleFederationPlugin 开发的时候，会变成明明是请求线上的别的应用的文件，却变成：`当前域名/文件路径`。也就是我开发的时候，明明应该请求的是 `http://heal.com/xxx.js`，却变成请求 `http://localhost:3000/xxx.js` 了。那么索性把全路径写全了。反正线上的地址也会是固定，不会变来变去。当然需要用标志位作区分，开发时候还是访问本地地址。

### 5、主应用热更新失效了

发现在有使用 ModuleFederationPlugin 插件的 `exposes` 配置下，热更新失效了，得手动刷新页面。

一开始查看 devtool 的 `Network` 面板里的 `ws` 一列（热更新通过 WebSocket 通知），发现有两个 WebSocket 通道，我就想会不会是两个互相影响导致没找对正确的通知路径出错了但是没有报错。但是看了一下子应用也是两个 ws，却没有问题。后面网上搜到不保证百分百有效的解决方法，webpack 配置，可查看[官方文档](https://webpack.js.org/configuration/optimization/#optimizationruntimechunk)：

```js
optimization: {
  runtimeChunk: 'single', // 这样设置可以解决主应用开发时热更新失效（子应用不会），原因未知
},
```

在我这项目是生效了，原理不详。