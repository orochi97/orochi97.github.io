---
title: webpack通过webpackJsonp来连接多文件依赖
date: 2020-08-16 21:59:15
categories:
- 开发
- 前端
---

webpack一般是打成一份文件，但有时也需要打成几份，生成的文件可以把其中的公共部分抽取出来，省点代码。
这里就免不了依赖文件顺序的问题。这里用了很巧妙的方法，来连接不同的文件，以及依赖的前置性问题。
相当用心思，这里稍微记录下。

先准备两份文件 foo.js，bar.js，util.js：
```js
// foo.js
import util from './util'

console.log('foo')
console.log(util('foo'))

// bar.js
import util from './util'

console.log(util('bar'))
console.log('bar')

export default function () {
	return 'bar-function'
}

// util.js
console.log('util')

export default function (flag) {
	return 'util' + flag
}
```
webpack配置文件：
```js
const { execSync } = require('child_process')
var webpack = require('webpack');

execSync(`rm -rf build`)

module.exports = {
    mode: 'development',
    devtool: 'none',//配置生成Source Maps，选择合适的选项
    entry:  { 
        foo: __dirname + "/foo.js",
        bar: __dirname + "/bar.js"
    },//已多次提及的唯一入口文件
    output: {
        path: __dirname + "/build",//打包后的文件存放的地方
        filename: "[name].js"//打包后输出文件的文件名
    },
     optimization: {
        splitChunks: {
          chunks: 'all',
          minSize: 1,
          maxSize: 0,
          minChunks: 1,
          maxAsyncRequests: 6,
          maxInitialRequests: 4,
          automaticNameDelimiter: '~',
          automaticNameMaxLength: 30,
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
            }
          }
        }
      }
}
```
会在 dist 文件夹生成三个文件：foo.js，bar.js，default~bar~foo.js
看得出 default-bar-foo.js 就是共用代码，这里就是 util.js，代码是：
```js
// window["webpackJsonp"]是个数组，push了一个数组。元素1还是一个数组，里面只有一个值"default~bar~foo"
// 其实就是这份文件名字，或者说是这份chunk名字
// 而第二个值就又是各个module的集合。比如这里只有一个util.js，结合chunk名就很明显了，
// util.js就是foo.js和bar.js共同用到的。如果还有其他共用到的，那么还有多几个字段
(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["default~bar~foo"],{
/***/ "./util.js":
/*!*****************!*\
  !*** ./util.js ***!
  \*****************/
/*! exports provided: default */
      // __webpack_exports__=module.exports
/***/ (function(module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.r(__webpack_exports__);
console.log('util')
/* harmony default export */ __webpack_exports__["default"] = (function (flag) {
	return 'util' + flag
});
/***/ })
}]);
```
如果平时有看过 webpack 生成的代码的话，就能很明显看出与入口文件打出来的内容很不一样，缺少了`webpackBootstrap`。
看看 foo.js，（bar.js也长得差不多），几个名词先说一下：

**module：**每一份文件的js代码。比如a.js引入了b.js，把a.js作为entry。那么到时打出来的就是只有一份a.js（该输出文件就是一份chunk，输出文件名字可变）。里面有两个模module，a.js和b.js。
**chunk：**要输出的每一份文件就是一个chunk（一个或多个module组成一份chunk），一般是一个entry对应一个chunk。如果像这种抽离公共js的，也是一个chunk，也会多于entry数。

**foo.js是**
一个自执行的函数，传入一个json对象。只有一个key值，是"./foo.js"。相对应的value其实是一个函数模块，就是foo.js的代码内容。
打包出来的js靠全局变量维系，window["webpackJsonp"]。在每个entry chunk的最上面都有webpack加载代码，而附属chunk则没有，只有看起来像数组push的代码，如default-bar-foo.js文件所示。

```js
/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
					// 这data就是window["webpackJsonp"] push进来的东西
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];// chunkId="default~bar~foo"
/******/ 		var moreModules = data[1];// {'./util.js':f}
/******/ 		var executeModules = data[2]; // 暂不知何用
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
                // resolves暂不知作何用
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
              // 标记chunk安装
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
                // 把每个chunk的每份module记录在modules，用以调用运行
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
            // 当有parentJsonpFunction这方法适合，就执行这个方法，参数为每个chunk代码
            // window["webpackJsonp"]里面的元素其实就是非入口chunk代码块
            // parentJsonpFunction取自上一个window["webpackJsonp"]的push的方法，
            // 当第一个script的入口chunk，它的parentJsonpFunction就是普通数组的push
            // 同时在第一个script的入口chunk，把window["webpackJsonp"]的push改写为第一个script的入口chunk的webpackJsonpCallback方法
            // 也就是第二个script的入口chunk里，这个parentJsonpFunction就是第一个script的入口chunk的webpackJsonpCallback方法
            // 这样就把两份chunk的代码通过这种方式联系起来
            // 当push（改写后的push）了非入口chunk，可以通过这种联系一层层传递到各个chunk的webpackJsonpCallback方法
            // webpackJsonpCallback里面再调用checkDeferredModules方法，来检查并执行相应的模块代码
            // 这样一来无论script顺序怎样，只要调用webpackJsonpCallback方法，就能达到加载的模块（chunk即为模块合集）传递到各个入口chunk
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
            // 看原注释是添加新的前置依赖
            // 暂不知为何是添加executeModules而不是一开始就写在deferredModules
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
          // 检查依赖到齐没有，并执行
          // 在主流程里会运行一次
          // 在webpackJsonpCallback里最后再运行一次，也就是每次有chunk的加载都会检查运行一次
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
                // depId="./foo.js","default~bar~foo"
/******/ 				var depId = deferredModule[j];
                // 是否已安装记录在installedChunks
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
              // 全部安装完毕
/******/ 			if(fulfilled) {
                // 把 deferredModules 清空
/******/ 				deferredModules.splice(i--, 1);
                // deferredModule[0]本chunk的名字，这里是"./foo.js"
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
          // 先看同步代码，从这里开始看起
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
          // 执行到这里，代表本身这个chunk也就是这个文件已加载
          // 这里同时也会标记别的chunk加载了没有，来判断前置依赖有了没有
/******/ 	var installedChunks = {
/******/ 		"foo": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
            // 每个加载的模块结果缓存起来
            // 这里每个module就是未打包前的每一份js
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
            // 这里注意到具体模块去看，会把这个模块的导出值赋值到module.exports
            // 然后再 return 出去，所以 __webpack_require__ 模块会返回加载运行模块的结果
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
            // 标记这个 module 加载过
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/  // 部分 __webpack_require__.字段 这里未体现作用
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
          // 打上 ES6 
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
          // 初始化window["webpackJsonp"]为一个数组
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
          // 把旧的window["webpackJsonp"]的push方法缓存起来，当然第一个就是数组的push方法
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
          // 改写window["webpackJsonp"]的push方法为webpackJsonpCallback
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
          // 把window["webpackJsonp"]的chunk传入webpackJsonpCallback执行一下
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
          // 这里再次把旧的window["webpackJsonp"]的push方法赋值到parentJsonpFunction
          // parentJsonpFunction会存在在这个chunk的作用域，在这个chunk的webpackJsonpCallback里被调用
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
					// 首位为本身chunk，后面为所依赖的chunk
					// 所以可以得知靠着installedChunks和deferredModules这两个变量来判断到底所需的文件加载好了没有
					// 以至于在script标签里的引入顺序会干扰到依赖加载从而影响执行
          // 注意这里是二维数组
/******/ 	deferredModules.push(["./foo.js","default~bar~foo"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./foo.js":
/*!****************!*\
  !*** ./foo.js ***!
  \****************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// 标记为 ES6 模块
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./util.js");

console.log('foo')
console.log(Object(_util__WEBPACK_IMPORTED_MODULE_0__["default"])('foo'))

/***/ })

/******/ });
```

通过全局的 webpackJsonp 这个数组来连接多份文件。改写了这个数组的 push 方法。让其在每次 push 的时候，都一层一层找上之前加载过的文件。
触发每份入口文件里的`检查依赖（checkDeferredModules）`，来判断前置依赖是否准备好。好则开始执行。