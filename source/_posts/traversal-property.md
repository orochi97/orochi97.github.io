---
title: 遍历属性的几个方法
date: 2020-07-25 12:00:18
categories:
- 开发
- 前端
---

这里列出五个

- for in
- Object.keys
- Object.getOwnPropertyNames
- Object.getOwnPropertySymbols
- Reflect.ownKeys

```js
Object.prototype.allattr = true
Object.prototype.allFn = function(){}

// 普通对象
const obj1 = {
  a: 1,
  b: 2,
  [Symbol('c')]: 3
}
Object.defineProperty(obj1, 'd', {
  enumerable: false,
  value: 4
})

// 原型对象
function Obj2 () {
  this.a = 1
  this[Symbol('b')] = 1
}
Obj2.prototype.c = 2
Obj2.prototype.d = function() {}
Obj2.e = 1

// 对象实例
const obj3 = new Obj2()

function show(obj) {
  let arr = []
  // 会打出原型的属性，可以用 hasOwnProperty 去除
  for (const attr in obj) {
    arr.push(attr)
  }
  console.log('--- for in ---', arr)

  arr = []
  // 不会打出原型的属性，相当于 for in 用 hasOwnProperty 去除
  Object.keys(obj).forEach((attr) => {
    arr.push(attr)
  })
  console.log('--- Object.keys ---', arr)

  arr = []
  // 上面两个只打出可枚举的，这个不可枚举也可以打出来，不会打出原型的属性
  Object.getOwnPropertyNames(obj).forEach((attr) => {
    arr.push(attr)
  })
  console.log('--- Object.getOwnPropertyNames ---', arr)

  arr = []
  // 打出 Symbols 属性
  Object.getOwnPropertySymbols(obj).forEach((attr) => {
    arr.push(attr)
  })
  console.log('--- Object.getOwnPropertySymbols ---', arr)

  arr = []
  // Reflect.ownKeys = Object.getOwnPropertyNames + Object.getOwnPropertySymbols
  Reflect.ownKeys(obj).forEach((attr) => {
    arr.push(attr)
  })
  console.log('--- Reflect.ownKeys ---', arr)
}

show(obj1)
console.log('%c --------------- 分割线 ---------------', 'background:#aaa;color:red')
show(Obj2)
console.log('%c --------------- 分割线 ---------------', 'background:#aaa;color:red')
show(obj3)
```
<br/>
{% asset_img traversal-property.PNG 遍历对象属性 %}