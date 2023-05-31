---
title: 从零搭建前端工程（上）
date: 2023-03-06 22:22:43
updated: 2023-05-31 21:11:36
categories:
- 开发
- 前端
---

***文章内容太多，分为上下两部分，这里是上半部分。下半部分在《[从零搭建前端工程（下）](/2023/04/21/fontend-engineering-2/)》，此篇的内容有：***
***1. 使用 webpack 打包（编译）vue***
***2. 使用 babel 处理 js***
***3. 使用 webpack-dev-sever 做热调试开发***

* * *
*****

产生这个的想法来自于某天接手一个项目，eslint 没配好，想着弄好格式化一下，一时之前忘了 cli 命令。
想一下，现在我们用的各种框架，都自带了脚手架工具，初始化后基本上不用怎么改造就可以上手开发。导致很多工程化的东西被人忽视了，就容易遇到问题时被卡住或者东找西找翻资料。
所以就想着自己从头搭建一个项目看看，遇到的一些配置、工具、命令都给记录下来，方便后面再遇到时候就不会生手了。

这里我就用 vue 来做基础框架，用 react 也一样，就一些编译工具的差别，大部分是一样的。要做的事有：

1. 使用 webpack 打包（编译）vue
2. 使用 babel 处理 js
3. 使用 webpack-dev-sever 做热调试开发
4. 使用 eslint + prettier 让代码健壮和优雅
5. 使用 husky + lint-staged 强制增量各类检查
6. 使用 @commitlint/cli 规范提交信息
7. 使用 埋点（性能 + 错误） 让项目运行更好

## 零、文件初始化

准备一个和 vue 脚手架创建出来的初始工程一样。有：

src：项目源代码
src/main.js：工程入口文件，在这里做 vue 初始化，也是 webpack 的entry
src/App.vue：一个主页面
src/components/HelloWorld.vue：一个子组件
src/assets/logo.png：一张图片资源
src/public：公共资源文件夹，这里放的东西依样拷贝进打包里（除了index.html）
src/public/index.html：用来做单页面工程入口 html 的基础模板

然后初始化一下 npm 环境：
```bash
npm init -y
```
`-y` 就是创建一份默认的，不需要一步步问要填什么。直接生成空信息，有需要自己再去填就好了。

<!-- more -->

## 一、使用 webpack 打包（编译）

安装 webpack。webpack-cli 是为了可以在终端命令启动 webpack。如果使用 api 启动就不需要安装这个。

```bash
npm install -D webpack webpack-cli
```

然后新建一份 `webpack.config.js` 在项目根目录。这是 webpack 的默认指定配置文件。用过老一点的 vue 工程的话，可能会有印象工程里有三份类似的配置 webpack.base.config.js/webpack.dev.config.js/webpack.prod.config.js，因为开发用和打生产包有些东西不一样，所以分了两份配置，再把共同的抽取成一份 base。后面的 vue 工程就看不到相关 webpack 配置了。全部都封装了起来。定义了一份 `vue.config.js` 做扩展入口。我们可以用命令打它里面的默认配置给打印出来，以供参考学习。

```bash
vue inspect > output.js
```

这点我觉得比 react 好。react 没有留扩展入口。如果自己想要 DIY 一些配置，要把配置打出来，而且过程不可逆。虽然一般可能也不太需要自己再加什么。或许也有别的方法，可能我没了解到。

webpack 的配置用法这里就不赘述了。直接把 webpack.config.js 内容展示出来，再来解释都是些啥。

```js
const { resolve } = require('path');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const cwd = process.cwd();

const publicDir = resolve(cwd, 'public');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  mode: 'development',
  devtool: isDev ? 'source-map' : false,
  entry: {
    main: resolve(cwd, 'src/main.js'),
  },
  output: {
    path: resolve(cwd, 'dist'),
    filename: '[name].js', // 打包后输出文件的文件名
  },
  devServer: {
    static: {
      directory: publicDir, // 指定静态资源的路径
    },
    compress: true, // 是否压缩
    port: 8080, // 指定使用端口
    hot: true, // 是否热更新，那肯定啦...
    open: true, // 编译完成打开浏览器
    client: {
      logging: 'error', // 终端显示错误即可
      overlay: { // warnings 类型不要挡着页面，error才展示为浏览器页面
        errors: true,
        warnings: false,
      },
    },
    // proxy: { // 配置代理
    //   '/api': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //   },
    // },
  },
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //     // minChunks: 3,
  //     // minSize: 0,
  //     cacheGroups: {
  //       default: {
  //         priority: 1,
  //         reuseExistingChunk: true,
  //         enforce: true
  //       }
  //     }
  //   }
  // },
  module: {
    rules: [
      {
        test: /\.js$/, // 解析 js 文件
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.vue$/, // 解析 vue 文件
        exclude: /node_modules/,
        use: 'vue-loader', // 17版本会导致 css 打包报错
      },
      {
        test: /\.css$/, // 添加对样式表的处理
        use: [
          // 请只在生产环境下使用 CSS 提取，这将便于你在开发环境下进行热重载
          // 'vue-style-loader' 与 'style-loader' 类似，会把处理好的 css 内容注入 js 里
          // 所以开发用 style-loader，生产用 MiniCssExtractPlugin.loader
          isDev ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.less$/, // 使用 less sass 这些要额外声明处理规则
        use: [
          isDev ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              // 新版本的file-loader选项esModule默认为true，
              // 需要将其设置为false，否则打包后src为[object Module]
              esModule: false,
              limit: 8192,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      '@': resolve(cwd, 'src'),
    },
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    // 参考官方文档 https://vue-loader.vuejs.org/migrating.html#a-plugin-is-now-required
    // Vue-loader在15.*之后的版本都是 vue-loader的使用都是需要伴生 VueLoaderPlugin的,
    new VueLoaderPlugin(),
    // 编译时替换全局变量
    new webpack.DefinePlugin({
      BASE_URL: JSON.stringify('./'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new ESLintPlugin({
      extensions: ['.js', '.vue'], // Default: 'js'
    }), // https://eslint.org/docs/latest/integrate/nodejs-api#-new-eslintoptions
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
    // 用来将打包的 js 注入到 index.html
    new HtmlWebpackPlugin({
      inject: 'body',
      template: resolve(publicDir, 'index.html'),
    }),
    // 把 public 的文件拷贝过去 dist 文件
    new CopyWebpackPlugin({
      patterns: [
        {
          from: publicDir,
          globOptions: {
            ignore: [
              '**/index.html', // html 由 HtmlWebpackPlugin 生成，不需要拷贝
              '**/.DS_Store',
              '**/Thumbs.db',
            ],
          },
        },
      ],
    }),
  ],
};
```

### 1 使用的 loader

基础的 `entry` 和 `outpout` 就不说了。我们知道 webpack 是一个模块解决方案，它就是把所有东西打包（编译）成能运行的 js。所有东西，种类很多，所以我们要告诉它各式各样的文件类型用对应的 loader 去处理，包括 js，也要相应 loader 去处理。所以在 `module.rules` 那里，可以看到指定了用 `babel-loader` 去处理 js 文件，用 `vue-loader` 去处理 vue 文件。

#### 1.1 vue-loader 干了啥

这里简单介绍一下 vue-loader 干了啥。我们知道，vue 文件是 \<template\> \<script\> \<style\> 三部分组成，里面还夹杂了 vue 自身的模板语法，正常浏览器当然不认识这么个写法。所以要把 vue 文件给编译成浏览器喜闻乐见的 js。vue-loader 先把这三部分拆分，分成三份文件，这是编译过程中产生的，并不会真的生成相应的文件。\<template\> 部分经过 ast 处理后也变成 js 了，用 babel-loader 去接着处理。\<style\> 则变成 css 文件，所以要指定 `style-loader` 和 `css-loader` 去处理。
**注意 vue-loader 还要搭配使用 VueLoaderPlugin**

#### 1.2 对样式的处理

上面提到，对于样式，我们使用了 `style-loader` 和 `css-loader`。但现在我们都会使用 less sass 等 css 预处理语言。当我们像 `<style lang="less">` 这样加上 lang 声明后，vue-loader就会从生成一份 .css 文件变成生成一份 .less 文件了。此时加上多一个相应的 loader，如 `less-loader`、`sass-loader` 先处理就行了。
注意这里还用到了 MiniCssExtractPlugin.loader，这是一个来自于插件 `mini-css-extract-plugin` 的一个附属插件，可以看到同时也使用了它的 plugin 部分。作用是：
将里面的所有 class 给抽取出来，生成一份单独的 style 文件。一来减轻 js 产物的体积。二来 css 改动频率应该比不上 js 的改动，可以针对做不一样的缓存策略。

#### 对其他资源的处理

一般都是用 `url-loader` 处理。一般都是小图标会转换成 base64 引入。稍微有点体积的，也不会参与编译了，都是上传到文件服务器，拿资源的 http 地址来使用。

### 2 使用的 plugin

上面提到的 VueLoaderPlugin 和 MiniCssExtractPlugin 就不赘述了。

#### 2.1 替换全局变量

有时候，我们经常有不同环境要注入不同变量的，比如开发与生产请求不一样的地址之类的。可以借助 `webpack.DefinePlugin` 将全局变量注入代码里。代码里直接写 `'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)` 这样，打包的时候，就会把这个字符给替换成相应的值，这样我们就把外部的值给注入到 web 应用里。**要注意的是，自己声明的全局变量，对于 eslint 或 tslint 是不认识，可能会报错。这时候需要在这两者的配置里声明这是全局变量，不要报错。**

#### 2.2 加入 eslint 做编译时语法检测

eslint 的具体用法下文再讲。这里 webpack 也需要集成 eslint，虽然在开发时候编辑器应该配好提醒，但还是需要在编译工具再做一层拦截兜底。以前是用 `eslint-loader` 的，现在发现改成用 `eslint-webpack-plugin` 了，不过用法依然简单，毕竟复杂的是 eslint 本身，而不是 webpack 怎么集成它。具体配置可看[介绍](https://eslint.org/docs/latest/integrate/nodejs-api#-new-eslintoptions)。

#### 2.3 生成单页面用的 html

单页面框架最后生成的是 js，也得有一个 html 页面作为载体。需要注入打包出来的 js，然后放到产出的文件夹里。用的是 `html-webpack-plugin` 插件。需要指定一个基础模板，就是 public 下的 index.html 啦。然后可以配置生成的名字啊，注入的 js 要放在那里什么的。还挺多不错的配置的，详情可看[介绍](https://github.com/jantimon/html-webpack-plugin#options)。

#### 2.4 拷贝静态资源文件

上面说了，public 的东西除了 index.html 由 html-webpack-plugin 生成外，其他的会依样拷贝到产出包里。这里用 `copy-webpack-plugin` 插件。当然，就一个拷贝动作，自己写点 node 代码也可以。

#### 2.5 分析包体积大小

庞大的项目会打出巨型的生产包。这时候我们需要知道到底是到底是哪里体积大了，比如是否有可替代的小体积依赖包等。用 `webpack-bundle-analyzer` 插件会生成一份分析结果的 html，里面详细列出了包的各个组成。

#### 3 其他点

再介绍下其他的一些配置点：

devtool：编译后的代码已经和我们写的源码大相径庭，这个字段用来配置 source-map 的类型，详情可看[官网](https://webpack.js.org/configuration/devtool/#devtool)介绍。
**要注意是，source-map的类型会影响编译速度。**

resolve.alias：给文件引用起别名。我们在写代码的时候，引进别的文件，要看清楚相对路径，写一大堆点点点。有了这个就可以不管三七二十一，比如根据配置 `'@': resolve(cwd, 'src')`，就可以直接了当的写：`import xxx from '@/yyy/zzz'`。webpack 会在编译时候自动去替换路径。
当然也不是百分百适用，比如层级特别深的 a.js 要引用同层级的 b.js，那不如就用相对路径 `./b.js` 就可以了。个人觉得超过两层，如 `../../b.js`, 就用 alias。
关于 resolve 还有很多实用的配置，详情可看[官网](https://webpack.js.org/configuration/resolve/#resolve)介绍

webpack 的配置还很多也复杂，以前还被笑称前端有个分类为 webpack 工程师。这里只示例一些基本的。真正的项目还是会使用更多的配置。甚至，还可能需要自己开发 loader 和 plugin。这里可以看一下之前写的文章[《webpack的配置》](/2020/11/22/webpack-config/)。里面示例了 loader 和 plugin 的基础写法和其他的一些配置介绍。

## 二、使用 babel 处理 js

虽然在 webpack 里就一个 `babel-loader` 完事，但是 babel 是一个很复杂而厉害的东西。值得单独说一说。

官网的概念就不说了，我笼统说下自己理解：众所周知，ECMAScript的标准制定，是领先于浏览器的实现的。有时候定好方法，浏览器不支持也是白搭。babel 就是用来抹平这部分差距。把各类超前的 js 编译成当前浏览器支持的语法。使得开发者也可以放心愉快地使用一些新的 api。

所以我们先安装 babel 一系列东西。
```bash
npm install -D @babel/core @babel/preset-env @babel/plugin-transform-runtime babel-loader
```
**@babel/* 这种 monorepo 仓库是 7 版本开始的。以前是 babel-core。**

在项目根目录下创建一份 `babel.config.js`，先把配置贴一贴：
```js
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // targets: {
        //   chrome: 100,
        // },
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ],
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
  ],
};

```

配置有两个东西：`presets` 和 `plugins`。

### 1 presets

告诉 babel，要编译到哪个标准的版本。据说以前是带有明显版本号的依赖名：`babel-preset-es2016`。这样搞不好每次新标准就要改新包了。干脆，就用一个 `@babel/preset-env` 代表最新。对于 vue 和 react 也推出了自己的 presets，`@vue/babel-preset-app` 和 `@babel/preset-react`。
这个写法也是比较特别，首先最外层是个数组，这个没问题。数组元素的话，如果没有参数的话，就是一个普通的字符串。如果有参数，就变成一个数组，第一个元素还是该 preset。第二元素就变成一份 json 配置。如上面示例，就是个二维数组。这个配置，有几个参数会比较常见到。

#### 1.1 target

指定到哪个浏览器版本，比如 100 版本的 chrome 是支持 async await 和 optional chaining 的，那就不会去转译这个语法。

#### 1.2 useBuiltIns

有三个值："usage" | "entry" | false, defaults to false。false 就是不启用。
**"usage"：** 必须在入口处主动引入（只能引一次） @babel/polyfill（已经包含core-js） 或者 core-js，就会注入一系列垫片函数，全部引入。
**"entry"：** babel 会判断到底使用了哪些当前指定浏览器版本不支持的方法，按需注入那些垫片函数。

#### 1.3 corejs

这个功能的核心库，可以不声明，默认用的是 2 版本。想要用 3 版本主动安装 [core-js](https://www.npmjs.com/package/core-js) 依赖库 3 版本以上，同时要像例子那样声明 `corejs: 3`。当然 3 版本比 2 版本功能丰富，对新功能支持就更好。

关于 presets 详情，可看官网[介绍](https://babeljs.io/docs/babel-preset-env#options)。

### 2 plugins

有时候，一些新语法新方法没法支持，就得自己注入一些垫片函数来支持。比如对于 async await 的支持，是注入了一个 regeneratorRuntime（大致是这个名字） 的方法来处理。我们经常看到的是这个插件：[@babel/plugin-transform-runtime](https://babeljs.io/docs/babel-plugin-transform-regenerator)。不引入是不是就不行？其实不引入也是可以支持的。

`@babel/preset-env` 内置了 `@babel/plugin-transform-regenerator`， 会对 async await 进行转译，但是是在每个模块的作用域给加上处理函数，这样可能造成多个冗余了这个处理函数。所以一般都会使用 `@babel/plugin-transform-runtime`，它是把处理函数给抽取成单独的模块函数，全局一份。

{% asset_img babel1.png babel1 %}
如图，是把整个方法写在这份文件里。一份 js 就有一份。在 webpack 的处理下，每一份 js 都是一个闭包模块。然后每个模块代码都有一样的这个方法。

{% asset_img babel2.png babel2 %}
如图，可以看到是变成引用了一个依赖方法，那么在 webpack 处理下，这个就会是同一个第三方方法，就只会有一份代码。

**注意有些旧版本 babel 没有注入处理函数，会报错： regeneratorRuntime is not defined。此时也要自己手动引入该函数，老版本叫 babel-plugin-transform-runtime，与使用的 babel-core、@babel/core 相呼应。**

### 3 一些 cli 命令

```bash
# 基本的单文件编译并指定输出文件及生成 source-map
babel src/index.js --out-file(-o) dist/lib.js --source-maps(-s)

# 编译一份文件夹内容并输出到一份文件夹
babel src --out-dir(-d) lib

# 编译整个 src 目录下的文件并将输出合并为一个文件。
babel src --out-file script-compiled.js

# 忽略规范和测试文件
babel src --out-dir lib --ignore "src/**/*.spec.js","src/**/*.test.js"

# 复制不需要编译的文件
babel src --out-dir lib --copy-files

# 自定义配置文件路径
babel --config-file /path/to/my/babel.config.json
```

## 三、使用 webpack-dev-sever 做热调试开发

这个大家也是耳熟能详了。现代化前端工程几乎离不开编译这个操作，如果每次改完代码，手动执行下编译操作，然后刷新页面，这开发体验也太灾难了。好在，还是 webpack，帮我们推出了 [webpack-dev-server](https://www.webpackjs.com/configuration/dev-server/)，可以虚拟打包产物放在内存，然后监听文件的修改，有修改就只更新那部分文件，大大提高了开发效率。

用法也很简单，在前面两个 webpack 工具前置安装完后，再安装这个。
```bash
npm install -D webpack-dev-server
```
然后搭配 webpack 启动
```bash
npx webpack serve
# 或
npx webpack-dev-server
```
还可以用 api 方式启动，用于需要判断众多环境启动不一样的服务的时候，随便新建一份 js：
```js
const { resolve } = require('path');
const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const webpackConfig = require(resolve(process.cwd(), 'webpack.config.js'));

const compiler = Webpack(webpackConfig);
const devServerOptions = { ...webpackConfig.devServer };
const server = new WebpackDevServer(devServerOptions, compiler);

const runServer = async () => {
  console.info('Starting server...');
  server.startCallback(() => {
    console.info(
      `Successfully started server on http://localhost:${webpackConfig.devServer.port}`
    );
  });
  // 或者 await server.start();
};
runServer();
```

用法简单，因为对于编译配置比如 loader、plugin 这些本身就和 webpack 如出一辙。用的同一份 webpack.config.js，只要用环境变量区分 production 和 development 就行了。要了解的是，针对于 webpack-dev-server 的配置。看看 `devServer` 字段的配置。上面的例子已经加了注释介绍。事实上还有很多功能，比如 proxy 可以访问到请求和响应对象，方便做一些接口的统一处理。这些都视实际情况而定。

* * *
*****

***以下内容请移步《[从零搭建前端工程（下）](/2023/04/21/fontend-engineering-2/)》阅读***
***4. 使用 eslint + prettier 让代码健壮和优雅***
***5. 使用 husky + lint-staged 强制增量各类检查***
***6. 使用 @commitlint/cli 规范提交信息***
***7. 使用 埋点（性能 + 错误） 让项目运行更好***