---
title: JS new 一个对象干了什么事
date: 2020-05-25 23:59:18
categories:
- 开发
- 前端
---

<br>

```js
function Person(name, age) {
  this.name = name
  this.age = age
}
Person.prototype.attr = 'human'
const man1 = new Person('123', 18)
console.log(man1.name)
console.log(man1.age)
console.log(man1.attr)

function _new(Constructor, ...param) {
  // 新建一个对象
  const obj = {} // Object.create(null)
  // 建立继承关系，__proto__指向构造函数原型，获得原型属性与方法
  // 这里获得 attr 属性
  obj.__proto__ = Constructor.prototype
  // 开始执行这个构造函数，就是这个构造函数的this方法属性挂到这个新对象上
  // 这里就是把 name 和 age 挂上去
  const ret = Constructor.call(obj, ...param)
  // const ret = Constructor.apply(obj, param)
  // 若构造函数中没有返回值或返回值是基本类型（Number、String、Boolean）的值，则返回新实例对象；
  // 若返回值是引用类型的值，则实际返回值为这个引用类型。
  return typeof ret === 'object' ? ret : obj
}
const man2 = _new(Person, '456', 20)
console.log(man2.name)
console.log(man2.age)
console.log(man2.attr)
```