---
title: JS的继承方式
date: 2020-05-21 23:26:20
categories:
- 开发
- 前端
---

### 1、原型链继承

```js
function SuperType(type) {
  this.property = true
  this.colors = ['red', 'blue']
  this.type = type
}
SuperType.prototype.getSuperValue = function() {
  console.log(this.property)
}

function SubType(type) {
  this.subproperty = false
  this.subtype = type
}

// 如果这里是 SubType.prototype = SuperType.prototype
// 则 this.property 值为 undefined
SubType.prototype = new SuperType('super')

SubType.prototype.getSubValue = function() {
  console.log(this.subproperty)
}

const instance = new SubType('one')

instance.getSuperValue()
instance.getSubValue()

console.log(instance instanceof SubType, instance.constructor)
console.log(instance instanceof SuperType)

instance.colors.push('black')
console.log(instance.colors, instance.type, instance.subtype)

const instance2 = new SubType('two')
console.log(instance2.colors, instance2.type, instance2.subtype)

// 所有实例的 colors 属性指向同一个对象，一改全改
// 如果父类有参数，没法带进去
```
<br>
{% asset_img 原型链继承.PNG 原型链继承 %}

### 2、构造函数继承

```js
function SuperType(type) {
  this.property = true
  this.colors = ['red', 'blue']
  this.type = type
}
SuperType.prototype.getSuperValue = function() {
  console.log(this.property)
}

function SubType(type) {
  SuperType.call(this, type)
  // 为了确保不被父级的属性覆盖，可以在这之后再赋值子类的属性
  this.subproperty = true
}

const instance1 = new SubType('one')

console.log(instance1 instanceof SubType, instance1.constructor)
console.log(instance1 instanceof SuperType, instance1.type)

// 没有用到原型的方法属性
// instance1.getSuperValue()

instance1.colors.push('black')
console.log(instance1.colors)

const instance2 = new SubType('two')
console.log(instance2.colors, instance2.type)

```
<br>
{% asset_img 构造函数继承.PNG 构造函数继承 %}

### 3、组合继承（原型链继承 + 构造函数继承）

```js
function SuperType(type) {
  this.property = 'true111'
  this.colors = ['red', 'blue']
  this.type = type
}
SuperType.prototype.getSuperValue = function() {
  console.log(this.property)
}

function SubType(type) {
  SuperType.call(this, type) // 调用一次
  // 为了确保不被父级的属性覆盖，可以在这之后再赋值子类的属性
  this.subproperty = true
}

SubType.prototype = new SuperType() // 调用两次

// 如果没有这一步，最终顺着父类的原型链指向父类SuperType
SubType.prototype.constructor = SubType

const instance1 = new SubType('one')

console.log(instance1 instanceof SubType, instance1.constructor)
console.log(instance1 instanceof SuperType, instance1.type)

instance1.getSuperValue()

instance1.colors.push('black')
console.log(instance1.colors)

const instance2 = new SubType('two')
console.log(instance2.colors, instance2.type)
```
<br>
{% asset_img 组合继承.PNG 组合继承 %}

### 4、原型式继承

```js
// 缺点：引用类型属性依然是共享的
function object(o) {
  function F(){}
  F.prototype = o
  return new F()
}

const person = {
  name: 'xiaoming',
  colors: ['1', '2']
}

const p1 = object(person)
const p2 = object(person)

console.log(p1.colors, p2.colors)

p2.colors.push('3')

console.log(p1.colors, p2.colors)

// 等同于
const p3 = Object.create(person, {
  name1: {
    value: 'xiaohong'
  }
})

console.log(p1, p2, p3, p3.name)
```
<br>
{% asset_img 原型式继承.PNG 原型式继承 %}

### 5、寄生式继承

```js
function object(o) {
  function F(){}
  F.prototype = o
  return new F()
}

// 包了一层，定义了个方法增强对象，
// 缺点是函数没法复用，引用类型属性依然是共享的
function createObject(o) {
  const clone = object(o)
  clone.say = function() {
    console.log(this.colors)
  }
  return clone
}

const person = {
  name: 'xiaoming',
  colors: ['1', '2']
}

const p1 = createObject(person)
const p2 = createObject(person)

console.log(p1.colors, p2.colors)

p2.colors.push('3')

console.log(p1.colors, p2.colors)

p2.say()
```
<br>
{% asset_img 寄生式继承.PNG 寄生式继承 %}

### 6、寄生式组合继承

```js
function SuperType(type) {
  this.name = 'true111'
  this.colors = ['red', 'blue']
}
SuperType.prototype.getSuperValue = function() {
  console.log(this.colors)
}

function SubType(name, age) {
  SuperType.call(this, name) // 调用一次
  // 为了确保不被父级的属性覆盖，可以在这之后再赋值子类的属性
  this.age = age
}

SubType.prototype = new SuperType() // 调用两次

// 如果没有这一步，最终顺着父类的原型链指向父类SuperType
SubType.prototype.constructor = SubType

const s1 = new SubType('saaa', 18)
const s2 = new SubType('sbbb', 19)

console.log('~1~', s1, s2)

s2.colors.push('yellow')

console.log('~2~', s1, s2)

// 这样每个 SubType 实例都有两组 name 和 colors，
// 一组是自身属性下，一组是原型链指向父类实例的

function inherit(newType, superType) {
  newType.prototype = Object.create(superType.prototype)
  newType.prototype.constructor = newType
}

function NewType(name, age) {
  SuperType.call(this, name) // 调用一次
  // 为了确保不被父级的属性覆盖，可以在这之后再赋值子类的属性
  this.age = age
}

inherit(NewType, SuperType)

const n1 = new NewType('nbbb', 20)
const n2 = new NewType('nccc', 21)

console.log('~3~', n1, n2, n1.constructor)

n1.colors.push('yellow')

console.log('~4~', n1, n2)
```
<br>
{% asset_img 寄生组合式继承-1.PNG 寄生组合式继承 %}
<br>
{% asset_img 寄生组合式继承-2.PNG 寄生组合式继承 %}
<br>
{% asset_img 寄生组合式继承-3.PNG 寄生组合式继承 %}
<br>
{% asset_img 寄生组合式继承-4.PNG 寄生组合式继承 %}

### 7、ES6 Class 继承（略）

## 总结
&emsp;&emsp;寄生式组合继承是 ES5 最完善的继承方式。细细一看，不就是跟 new 一个实例所做的操作差不多吗。不同之处在于复制的对象原型不一样。当然具体还是有差别，一个是原型，一个实例化。