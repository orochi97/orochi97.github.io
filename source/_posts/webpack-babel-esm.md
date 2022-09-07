---
title: “@babel/plugin-transform-runtime” 影响 webpack 的打包结果
date: 2022-09-05 21:19:04
updated: 2022-09-07 22:46:24
categories:
- 开发
- 前端
---

### 一、现象与结果

先说结果，要不从问题到结果可能太大相庭径，都看不下去。

结论就是： webpack + react 项目 project，使用了一份由 webpack 打包出来的 umd（不了解 umd 可以看知乎上大佬的[文章](https://zhuanlan.zhihu.com/p/75980415)） 库 library。library 源代码是用 es6 语法写的。project 这边对于 library 的 import 出来的值只是个空对象，没有源代码导出的东西。在 react 脚手架创建出来的项目使用 library，却可以得到导出值。
抽丝剥茧后发现是 `@babel/plugin-transform-runtime` 插件，将 library 处理为 es module，导致 project 在使用 library 的时候，因为 webpack 自身的包装函数作用，使得 library 使用出现了偏差而有问题。

### 二、从头看起

上面描述还是有点难理解，需要结合代码来看，否则云里雾里。
起因是需求为，想要把一些 react 组件或者页面打包成一个完整的功能块，发成依赖库。选择了用 webpack 打出 umd 功能的包。
**（这里说一下，对于打包库的工具，还是不建议用 webpack，可以选择 rollup 等其他。因为 webpack 为了处理模块化，引入了自身的[包装函数](https://blog.cchealthier.com/2020/08/16/webpackJsonp/)，导致代码不太“纯净”。对此需求其实之前已经对 vue 工程有过这样的实操，用 rollup 打包，以路由模块的形式引入。）**

同事试了之后，就是没导出值。找我一起探讨，我看到网上说，webpack4 似乎不支持产出 es module 的包，只有 umd 格式的。由此还有相应专门处理的[插件](https://www.npmjs.com/package/@purtuga/esm-webpack-plugin)，至此，我以为就单纯是 webpack4 不支持而已。

周末时候有时间，我就想确实自己没细细研究过 webpack 到底能不能打出 es module 的库，知道能打出 umd 格式的。之前做工具库的时候，使用的也是 rollup 和 gulp。正好研究下，看看到底打出来的东西有虾米不同。

首先用 webpack5（这里说一下，webpack 4 和 5 差别挺大，包装函数都大大缩小了） 打包出一份 umd 的 library，然后顺手在一个 react 脚手架 cra 创建出来的项目试了，嗯，可以。webpack5 果然可以。

接着换成 webpack4，同样配置，打包输出，还是在刚刚的项目引入，来看看到底为啥...woc？也可以？webpack 4、5 打包出来的 umd library 在 cra 项目都可以。马上换到实际项目一看，还是没有导出值。也就是和 webpack 版本打包出来无关，和具体的使用方项目的配置有关！这就刺激了，因为不知道原因和原理，只能逐一分析对比，没想到又来到大家来找茬环节。

<!--more-->

### 三、SHOW CODE

前置剧情描述完毕，接下来是代码时间。

#### 首先是 library 这边的准备

1. library 源代码，简简单单，名字就叫 a.js 就可以了：
```js
export const aaaUtil = () => {
  console.log('aaaUtil')
}
export default function () {
  console.log('aaa')
}
```
2. library 的 webpack.config.js，也是简简单单，最关键是那个 libraryTarget 配置：
```js
module.exports = {
  mode: 'development',
  devtool: 'none', // 不要 source-map
  entry:  { 
      a: __dirname + '/a.js'
  },
  output: {
    path: __dirname + '/build', // 打包后的文件存放的地方
    filename: '[name].js', // 打包后输出文件的文件名
    libraryTarget: 'umd', // 打包出 umd 格式文件
  },
  optimization: {
    minimize: false, // 不压缩
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ]
  }, 
}
```
3. library 的 babel.config.js：
```js
module.exports = {
  presets: ['@babel/preset-env']
};
```

#### 然后是 cra 项目这边的准备

1. 使用代码，随便找个地方进去就好，把打包后的 a.js 给引用一下，我这里是放在一个按钮的点击回调里，方便打印：
```jsx
import React from 'react'; // TODO：这里有个注意要点，后面说

function Button() {
  const click = () => {
    console.log(require('./a.js'));
  };
  return (
    <div><button onClick={click}>按钮</button></div>
  );
}

export default Button;
```
2. 配置 cra 项目的 babel.config.js
```js
module.exports = { // 注意这里的 {'runtime': 'automatic'} 就是响应上面的 TODO，主动注入 React，否则会报 React not defined
  presets: ['@babel/preset-env', ['@babel/preset-react', {'runtime': 'automatic'}]],
  plugins: ['@babel/plugin-transform-runtime'],
};
```
3. 然后看看默认 cra 项目打包，是用了什么配置，一路追踪发现是在 react-scripts/config/webpack.config.js，然后我们找到里面对于 js 的处理，注释掉，换成自己的处理。
也可以另外在根目录配置 webpack.config.js，自己调用 webpack 对其进行打包。
```js
{
  test: /\.jsx?$/,
  exclude: [/node_modules/],
  loader: require.resolve('babel-loader'),
  options: {
    babelrc: false,
    configFile: path.resolve(process.cwd(), 'babel.config.js'),
  },
},
```
{% asset_img webpack-babel-esm-1.PNG webpack-babel-esm-1 %}

然后来看一下，分别有和没有经过 '@babel/plugin-transform-runtime' 处理的结果。

没有经过处理，能获取到导出模块：
{% asset_img webpack-babel-esm-2.PNG webpack-babel-esm-2 %}

有经过处理，获取不到导出模块：
{% asset_img webpack-babel-esm-3.PNG webpack-babel-esm-3 %}

这里我们就直接说出第一手原因，a.js 如下图，在有 `exports` 这个对象的前提下，就会对 `exports` 进行赋值，在使用方就能获取到导出的模块值。所以在 define 那里或者 root 那里执行的话，就获取不到。
{% asset_img webpack-babel-esm-4.PNG webpack-babel-esm-4 %}

换句话说，就是为啥 `exports` 时有时没有，就会影响这个结果。但是单从这里没有上下文，看不出原因。我们把代码不压缩地打包出来：

没有经过 '@babel/plugin-transform-runtime'，可以看到在 a.js 的外层包装代码里，有个 exports 参数传入：
{% asset_img webpack-babel-esm-5.PNG webpack-babel-esm-5 %}

经过 '@babel/plugin-transform-runtime'，`exports` 变成 `__webpack_exports__` 了：
{% asset_img webpack-babel-esm-6.PNG webpack-babel-esm-6 %}

原因大致可以看看这篇文章里提到的[《Uncaught ReferenceError: exports is not defined 问题记录》](https://cnodejs.org/topic/61e846369945826c2bf7df10)，里面说了 '@babel/plugin-transform-runtime' 会给文件打上 import 等之类的 es6 语法，那么就导致 webpack 会认为该份文件是 es6 文件，就会注入 `__webpack_exports__` 而不是 `exports` 了。可以再看看这篇[文章](https://segmentfault.com/q/1010000019999394?bd_source_light=4746641)的回答。

### 四、总结

既然知道原因了，就有解决方法，比如:

1. helpers 位置 false，不过这样这个插件似乎就没意义了。
```js
module.exports = {
  presets: ['@babel/preset-env', ["@babel/preset-react", {"runtime": "automatic"}]],
  plugins: [['@babel/plugin-transform-runtime', { helpers: false }]],
};
```

2. sourceType 设置为 `unambiguous` 或 `script`。解释还是看[官网](https://babeljs.io/docs/en/options#sourcetype)吧。应该就是直接看代码里有没有 import export 来判断是否是 es6 文件。至于和 '@babel/plugin-transform-runtime' 为啥没发生作用就不知道了。
```js
module.exports = {
  presets: ['@babel/preset-env', ["@babel/preset-react", {"runtime": "automatic"}]],
  plugins: ['@babel/plugin-transform-runtime'],
  sourceType: 'unambiguous',
};
```

到这里基本问题就结了，为了一锤定音的证据，我甚至到 '@babel/plugin-transform-runtime' 代理去打印，确实不经过它处理，结果就不一样。我认为这不算 bug 吧。webpack 的判断没问题，这里的组合是要用 webpack 处理经过 webpack 打包出来的 umd 格式库，同时又经过了 '@babel/plugin-transform-runtime' 处理才有这个问题。webpack 有它的规矩，babel 有它的规矩，只是刚好在某种场景下一组合就有意料不到的问题。通过配置解决方法也是，但还是说下不建议用 webpack 做库函数的打包。

##### 注意一
webpack 的配置里有 exclude，按理说库函数不会处理。但是一开始是用了本地 yarn link，似乎检测不到是 node_modules 里的？

##### 注意二
`NODE_ENV=development` 注入这个 node 参数，也会不经过 '@babel/plugin-transform-runtime' 处理，原因不详......。我上面的示例是直接打包出来看的。因为使用 yarn start 进入开发模式，就会强设置 process.env.NODE_ENV=development。