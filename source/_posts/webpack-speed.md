---
title: webpack 的快
date: 2020-12-06 10:34:40
categories:
- 开发
- 前端
tags:
- 工程化
---

现在啥都离不开性能。性能其实就是讲快的问题。一般 webpack 的快，都是讲它的构建（打包）的速度，但其实也可以有辅助运行时候的快的。
简单记录一下。

### 构建速度

#### 一、缓存

基本上只要讲到快的肯定都有缓存。

1. [webpack5 的持久化缓存](https://webpack.js.org/configuration/other-options/#cache)

2. 各类 loader 自带的缓存功能（比如 babel-loader的 cacheDirectory: true）

3. cache-loader

4. hard-source-webpack-plugin

5. [DllPlugin 和 DllReferencePlugin](https://webpack.js.org/plugins/dll-plugin)

前面四个是编译一次后产生缓存，也就是用以第二次缓存。
最后一个 Dll 是把一些不常变化的先打包好，然后引进来就可以了，不要每次都花时间构建。另类缓存。

#### 二、加速文件查找

1. 对文件进行编译，那文件多少，找文件也是个耗时的工作。webpack 配置的 resolve 字段，就是用来告诉查找规则。
```js
module.exports = {
  resolve: { // 配置一系列搜索资源的规则
    alias: { // 起别名，相当于转换成绝对路径了，所以比相对路径快
      @src: path.resolve(process.cwd(), 'src')
    },
    // 引用的文件可以不加后缀，会找这些后缀的文件，引用文件详细到后缀名最快了
    // 但是一般也习惯不写后缀名，但这字段不要太多吧
    extensions: ['.wasm', '.mjs', '.js', '.json'],
    // 明确告诉 webpack 搜索哪个依赖文件，可以用绝对路径写死
    modules: ['node_modules']
  }
}
```

2. 以及 loader 配置里的 `include` 和 `exclude` 来告诉 webpack 哪些需要编译哪些不需要，不干活当然最省时间。

#### 三、多进程打包

1. happypack（作者都推荐用 thread-loader 了。。。）

2. [thread-loader](https://webpack.js.org/loaders/thread-loader/)

### 运行速度

#### 一、缓存

还是避不开缓存，这个结合《[关于缓存的几个关键词](2020/07/02/cache/)》最下面内容来看。就是跟浏览器的缓存策略搭配起来。

#### 二、花样减少代码

1. 压缩代码，现在 prodcution 模式，webpack 会自定开启混淆压缩功能了。（当然也可以自己[配置压缩功能](https://webpack.js.org/configuration/optimization/)）

2. 减去不被触及的代码，[Tree Shaking](https://webpack.js.org/guides/tree-shaking)，但我想还是尽量不要写这种代码吧，Tree Shaking 也不是百分百靠谱。

3. 按需加载，配合 ES6 的 `import export`，webpack就会处理了。没有用到的模块就不打包进来。
**注意：**这里提一下，require 也可以使用，但并不是浏览器支持 require，而是 webpack 对其做了方法处理。
无论是 import 还是 require，最终都会变成 `__webpack_require__`。使用 require 就没有按需这种功效了。代码都会全部打进去。
而且因为 import 语法原因，所以需要放在最上面声明，是静态解析，所以才能分析出哪些要不要。（其实这部分是 babel 干的活）
当然 require 也有用处，代码虽然都打进来，但是不会一开始就运行（调用 require 了才会），也就是省去一开始的解析时间，最关键的还是，可以条件引入：
```js
function getModule(flag) {
  if (flag) {
    return require('./a.js')
  }
  return require('./b.js')
}
```

4. 抽出公共js，虽然大部分工程都会打成一个 js，但有些还是会有多份，就可能存在重复代码，然后这个相当复杂的 [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin) （[CommonsChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/)的升级版，不过这家伙已经是时代的眼泪了）就出场了。可以抽出公共组件，可以很精细地配置，当然官网说他们的默认配置最优了，没什么事就不要瞎改了。

5. 异步加载，这个就跟上面那个有千丝的关系。我们运行性能讲究一个最小展示，可以看下[JS性能优化探讨](/2020/05/28/js-performance/)里的加快响应。
有些功能不一定会被点到，那这部分功能就可以延后初始化。那相关的 js 就可以延迟加载。也即是动态加载，对应上面说的 import 是静态加载。使用 webpack 的语法 [import()](https://webpack.js.org/guides/code-splitting/#dynamic-imports)。这个跟 require 不同，不会被打包进去，而是抽多一份 js 出来。延迟去下载。

6. 合并js文件，这个就跟上面那两个有万缕的关系。抽的 js 太多就会增多 http 请求，这是最耗性能的，走多一次 http 的消耗可能比一次请求多点内容更消耗，当然 http2 的多路复用另说。
[LimitChunkCountPlugin](https://webpack.js.org/plugins/limit-chunk-count-plugin/) 和 [MinChunkSizePlugin](https://webpack.js.org/plugins/min-chunk-size-plugin/)（LimitChunkCountPlugin功能多一点，没具体使用过） 用于合并小 js 文件。实际场景中，我们就曾在使用 monaco-editor（vscode的网页版）的时候，打包出来有很多细碎的 js，然后用了 MinChunkSizePlugin 把小 js 文件给合成一份。
