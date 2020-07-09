---
title: 自己实现call，apply，bind
date: 2020-07-09 22:58:38
categories:
- 开发
- 前端
---

### 介绍
这三个都是改变函数里的 this 指向
第一个参数都是用来替换 this 的对象，后面是原来函数的参数，不定个数
当第一个参数为 null 或 undefined，则里面 this 指向 window

call，apply用法一样，区别在于
```js
func.call(obj, a, b, c, ...) // 后面的参数是一个一个
func.apply(obj, []) // 后面的参数是一个数组
// 这里有个帅气的找出数组最大值
Math.max.apply(null, [1,2,3,4,1,2,3])
```
bind 比较特别，返回的是个函数，不执行
```js
// 后面的参数也是一个一个，同时会被锁住，成为原函数的前几个参数
const newFn = bind.call(obj, a, b, c, ...)
// 再调用的时候，参数为原函数的第n+1个参数
newFn(e, f, g, ...)
```

### 上码

```js
var name = 'windowname'
var age = 'windowage'  
const boy = {
  name: 'xiaoming',
  age: 18,
  show (a, b, c) {
    console.log(`${this.name} is ${this.age}`, a, b, c)
  }
}
const girl = {
  name: 'xiaohong',
  age: 16
}
boy.show(7, 8, 9) // xiaoming is 18 7 8 9

// 先来正常的结果
console.log('------------------- 对比 -------------------')
boy.show.call(girl, 17, 18, 19, 10) // xiaohong is 16 17 18 19
boy.show.apply(girl, [27, 28, 29, 20]) // xiaohong is 16 27 28 29
boy.show.call(null, 17, 18, 19, 10) // windowname is windowage 17 18 19
boy.show.apply(undefined, [27, 28, 29, 20]) // windowname is windowage 27 28 29

const bindFn1 = boy.show.bind(girl, 17, 18, 19, 10)
bindFn1() // xiaohong is 16 17 18 19
bindFn1(1, 2, 3) // xiaohong is 16 17 18 19

const bindFn2 = boy.show.bind(girl, 27)
bindFn2() // xiaohong is 16 27 undefined undefined
bindFn2(1, 2, 3) // xiaohong is 16 27 1 2

const bindFn3 = boy.show.bind(null, 27)
bindFn3() // windowname is windowage 27 undefined undefined
bindFn3(12, 13, 14) // windowname is windowage 27 12 13

console.log('------------------- 分割线 -------------------')
// 通俗来讲就是哪个对象调用了函数，this就指向谁，当前面没有谁调用则是window
// 绑定对象赋予一个字段为函数，来调用这个函数
// 当绑定对象为 null 或者 undefined，则让这个函数单独运行，自然 this 会指向window
// 随机数的为了不要不小心覆盖到绑定对象原来的属性
// 不能绑定后对象多了个新属性，要删掉多出来的字段函数，雁过不留痕
Function.prototype._call = function(context, ...param) {
  // 随便的随机名字
  const functionName = Math.floor(Math.random() * 100000)
  let result
  if (context) {
    context[functionName] = this
    result = context[functionName](...param)
    delete context[functionName]
  } else {
    result = this(...param)
  }
  return result
}

// 当不能用 ES6 的解构时候，就用字符串拼接起来，然后用 eval 触发
Function.prototype._call2 = function() {
  const functionName = Math.floor(Math.random() * 100000)
  const params = []
  let _context
  for (let i = 1, l = arguments.length; i < l; i++) {
    params.push(arguments[i])
  }
  if (arguments[0]) {
    _context = arguments[0]
    _context[functionName] = this
    paramStr = `_context[functionName](${params.join(', ')})`
  } else {
    _context = this
    paramStr = `_context(${params.join(', ')})`
  }
  const result = eval(paramStr)
  delete _context[functionName]
  return result
}

Function.prototype._apply = function(context, arr) {
  const functionName = Math.floor(Math.random() * 100000)
  let result
  if (context) {
    context[functionName] = this
    result = context[functionName](...arr)
    delete context[functionName]
  } else {
    result = this(...arr)
  }
  return result
}

Function.prototype._bind = function(context, ...oldParam) {
  const fn = this
  if (context) {
    return (...newParam) => {
      const functionName = Math.floor(Math.random() * 100000)
      context[functionName] = fn
      const result = context[functionName](...oldParam, ...newParam)
      delete context[functionName]
      return result
    }
  }
  return (...newParam) => {
    return fn(...oldParam, ...newParam)
  }
}

boy.show._call(girl, 17, 18, 19, 10)
boy.show._apply(girl, [27, 28, 29, 20])
boy.show._call(null, 17, 18, 19, 10)
boy.show._apply(undefined, [27, 28, 29, 20])

const _bindFn1 = boy.show._bind(girl, 17, 18, 19, 10)
_bindFn1()
_bindFn1(1, 2, 3)

const _bindFn2 = boy.show._bind(girl, 27)
_bindFn2()
_bindFn2(1, 2, 3)

const _bindFn3 = boy.show._bind(null, 27)
_bindFn3()
_bindFn3(12, 13, 14)
```
