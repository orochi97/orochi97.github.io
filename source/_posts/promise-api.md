---
title: Promise的几个api用法
date: 2020-08-30 10:10:37
categories:
- 开发
- 前端
---

[Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise) 应该大家都很熟悉了。大部分的库也都用上了Promise。
这文章主要记录下 Promise.all、Promise.allSettled、Promise.race 这几个的用法。

**Promise.all：**
参数是一个数组，数组元素是各个Promise。要数组里面所有的 Promise 都返回成功，那这个 Promise.all 的结果才会是成功。成功返回数组，就是元素成功的结果集合。失败的话返回单值，是元素里第一个失败的结果。

**Promise.allSettled：**
跟 Promise.all 参数一样，是一个数组，数组元素是各个Promise。不同的是这个不会因为数组元素的成败来返回成功失败。返回的是个数组，记录着元素 Promise 的各个结果，包括成败。

先准备四个小函数，然后再混起来用：
```js
function PromiseSuccess0() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('PromiseSuccess0')
    }, 0)
  })
}
function PromiseSuccess1000() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('PromiseSuccess1000')
    }, 1000)
  })
}
function PromiseError2000() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('PromiseError2000')
    }, 2000)
  })
}
function PromiseError3000() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('PromiseError3000')
    }, 3000)
  })
}

Promise.all([PromiseSuccess0(), PromiseError3000(), PromiseError2000()])
 .then((data) => {
   console.log('success all-1: ', data)
 })
 .catch((error) => {
   console.error('error all-1: ', error)
    // error all-1:  PromiseError2000
 })

Promise.all([PromiseSuccess0(), PromiseSuccess1000()])
 .then((data) => {
   console.log('success all-2: ', data)
    // success all-2:  (2) ["PromiseSuccess0", "PromiseSuccess1000"]
 })
 .catch((error) => {
   console.error('error all-2: ', error)
 })

Promise.allSettled([PromiseError2000(), PromiseSuccess1000()])
  .then((data) => {
    console.log('success allSettled: ', data)
    // success allSettled:  
    // (2) [{…}, {…}]
    // 0: {status: "rejected", reason: "PromiseError2000"}
    // 1: {status: "fulfilled", value: "PromiseSuccess1000"}
  })
  .catch((error) => {
    console.error('error allSettled: ', error)
  })
```

**Promise.race**
顾名思义，竞赛。参数依然是个元素为 Promise 的数组。会返回第一个跑完的元素结果。话不多说，上码：
```js
function load1000() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('load1000')
    }, 1000)
  })
}
function load3000() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('load3000')
    }, 3000)
  })
}
function errorTimer() {
 return new Promise((resolve, reject) => {
   setTimeout(() => {
     reject(new Error('timeout'))
   }, 2000)
 })
}

Promise.race([load1000(), errorTimer()])
 .then((data) => {
   console.log('success race-1: ', data)
   // success race-1:  load1000
 })
 .catch((error) => {
   console.error('error race-1: ', error)
 })

Promise.race([load3000(), errorTimer()])
 .then((data) => {
   console.log('success race-2: ', data)
 })
 .catch((error) => {
   console.error('error race-2: ', error)
   // error race-2:  Error: timeout
 })
```
具体的使用场景可以是，比如下载个东西，给其设定个时间限定，超过这个时间就报错。稍微封装一下：
```js
function addTimer(fn, time) {
 const errorTimer = new Promise((resolve, reject) => {
   setTimeout(() => {
     reject(new Error('timeout'))
   }, time)
 })
 return Promise.race([fn(), errorTimer])
}

addTimer(load1000, 2000)
 .then((data) => {
   console.log('success addTimer: ', data)
 })
 .catch((error) => {
   console.error('error addTimer: ', error)
 })
```
