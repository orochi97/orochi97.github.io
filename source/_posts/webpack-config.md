---
title: webpack的配置
date: 2020-11-22 22:27:35
updated: 2020-11-29 12:29:43
categories:
- 开发
- 前端
---

webpack也用了好久，想来短期内前端暂时也离不开它。虽然现在很多框架都集成了，但难免还是会遇到需要自己配置的时候。在这里记录下一些基础配置。
以下基于 webpack5，不过一般差别不大

```js
const path = require('path')
const { execSync } = require('child_process')
const webpack = require('webpack')
const Customplugin = require('./custom-plugin')

// 默认也会覆盖，不过我习惯删了，windows不支持命令的话，可以改用 fs 模块
execSync(`rm -rf build`)

module.exports = {
  context: process.cwd(), // 当前上下文，一般也不用配置
  mode: 'development', // 打包模式，production模式自动压缩混淆
   // source-map 类型 
   // https://webpack.js.org/configuration/devtool/#root
  devtool: false,
   // 编译信息，一般也不需要那么多，可以精细配置 
   // https://webpack.js.org/configuration/stats/#root
  stats: 'none',
  entry:  { 
    a: __dirname + '/a.js',
    b: __dirname + '/b.js',
    c: __dirname + '/c.js'
  }, // 指定文件入口
  output: {
    path: __dirname + '/build',// 打包后的文件存放的地方
    filename: '[name].js'// 打包后输出文件的文件名，比如上面打出来就会是 a.js b.js c.js
  },
  // externals：不打包某些库 https://webpack.js.org/configuration/externals/#externals
  optimization: {
    minimize: false, // 不要压缩
     // 抽出公共js，贼复杂，一般用默认的就可以了 
     // https://webpack.js.org/plugins/split-chunks-plugin/#root
    splitChunks: {
      chunks: 'all',
      // minChunks: 3,
      // minSize: 0,
      cacheGroups: {
        default: {
          priority: 1,
          reuseExistingChunk: true,
          enforce: true
        }
      }
    }
  },
  module: {
    rules: [
      { // 添加自定义 loader
        loader: './custom-loader.js',
        options: {
          param: 1
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
        options: {
          cacheDirectory: true,
          presets: ['@babel/preset-env'],
          plugins: ['@babel/transform-runtime']
        }
      },
      {
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          {
            loader: 'less-loader',
            options: {
              noIeCompat: true
            }
          }
        ]
      }
    ]
  }, 
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"development"',
    }),
    new Customplugin({ params: 1 }) // 添加自定义 plugin
  ],
  resolve: { // 配置一系列搜索资源的规则
    alias: { // 起别名，方便资源引用
      @src: path.resolve(process.cwd(), 'src')
    },
    // 引用的文件可以不加后缀，会找这些后缀的文件
    extensions: ['.wasm', '.mjs', '.js', '.json'],
    // 告诉 webpack 搜索哪些文件夹，可以用绝对路径写死
    modules: ['node_modules'],
    // 从npm包导入时，例如import * as D3 from 'd3'，此选项将确定package.json选中其中的哪些字段
    mainFields: ['browser', 'module', 'main'],
    // 解析目录时要使用的文件名，一般都是 index 了，不要瞎改
    mainFiles: ['index']
  }
}
```
自定义loader：


```js
const loaderUtils = require('loader-utils')

// https://webpack.js.org/api/loaders/
module.exports = function (content, map, meta) {
  console.log(this.data.value) // 123，具体场景看文档
  // 用 loaderUtils 解析这个 loader 的参数
  const options = loaderUtils.getOptions(this)

  // 最后要以一个模块的导出形式
  content = `module.exports = function () { ${content} }`

  // 同步
  this.callback(null, content, map, meta)
  return// 当调用 callback() 时总是返回 undefined

  // 同步
  // return content

  // 异步
  // const callback = this.async()
  // callback(null, result, map, meta)
}

// 可以定义一个 pitch 方法，要写在 loader 方法下面，但是会先于 loader 方法执行
module.exports.pitch = function(remainingRequest, precedingRequest, data) {
  data.value = 123
}
```

自定义plugin：

```js
const pluginName = 'CustomPlugin'

// https://webpack.js.org/api/plugins/
// 写成 ES5 prototype 形式也可以，一定要有 apply 方法
class CustomPlugin {
  constructor (options) {
    this.options = options
  }
  apply(compiler) {
    // compiler 和 compilation 有很多生命周期钩子
    compiler.hooks.run.tap(pluginName, compilation => {
      console.log('The webpack build process is starting!!!')
    })
  }
}

module.exports = CustomPlugin
```