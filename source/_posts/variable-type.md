---
title: 判断变量类型的几个方法
date: 2020-07-25 17:44:02
categories:
- 开发
- 前端
---

前置
```js
function Person() {}
const p = new Person()
```

## 一、 typeof 

```js
console.log(typeof []) // object
console.log(typeof {}) // object
console.log(typeof function(){}) // function
console.log(typeof '') // string
console.log(typeof 1) // number
console.log(typeof true) // boolean
console.log(typeof undefined) // undefined
console.log(typeof null) // object
console.log(typeof NaN) // number
console.log(typeof /abc/) // object
console.log(typeof Symbol()) // symbol
console.log(typeof new Date()) // object
console.log(typeof new Map()) // object
console.log(typeof new Set()) // object
console.log(typeof Person) // function
console.log(typeof p) // object
```

区分不了更精细的对象，比如数组和后面三个也被判断为对象。虽说数组和函数也是对象的一种。但函数都有自己的姓名。
参考了 [w3help](http://www.w3help.org/zh-cn/causes/SD9028) 上的资料来看，标准如此：

{% asset_img typeof.PNG typeof %}

**PS：**
__native object：__原生对象，ECMAScript 实现中，并非由宿主环境，而是完全由本规范定义其语义的对象。这些引用类型在运行过程中需要通过new来创建所需的实例对象。如：Object、Array、Date、RegExp、Function、Boolean、Number、String。（听起来就是语言标准自带的）
__built-in object：__内置对象，由 ECMAScript 实现提供，独立于宿主环境的对象，ECMAScript 程序开始执行时就存在。内置对象是本地对象的子集。包含：Global和Math、JSON。
__host object：__宿主对象，由宿主环境提供的对象，用于完善 ECMAScript 执行环境，如 Window 和 Document。

看起来数组属于 **native object**，同时没有 **implement [[Call]]** （没有这个内置属性？），所以返回会是个对象。

不过如果不需要判断得那么精细，那也够用了。而且这个可以直接 typeof 一个没有定义过的变量，会返回undefined。或许有些地方也可以利用起来。
另，可以看下 [segmentfault](https://segmentfault.com/q/1010000011846328) 大佬对于 `typeof(null) === 'object'` 的回答。

## 二、 constructor

```js
console.log([].constructor.name) // Array
console.log({}.constructor.name) // Object
console.log(function(){}.constructor.name) // Function
console.log(''.constructor.name) // String
const number = 1
console.log(number.constructor.name) // Number
console.log(true.constructor.name) // Boolean
// console.log(undefined.constructor.name) // 报错
// console.log(null.constructor.name) // 报错
console.log(NaN.constructor.name) // Number
console.log(/abc/.constructor.name) // RegExp
console.log(Symbol().constructor.name) // Symbol
console.log(new Date().constructor.name) // Date
console.log(new Map().constructor.name) // Map
console.log(new Set().constructor.name) // Set
console.log(Person.constructor.name) // Function
console.log(p.constructor.name) // Person
```

只有 constructor 也行，返回就是这个这个变量的原型。

需要注意的是实例 p 返回的是 Person 这个原型。

## 三、 instanceof

先看 [定义](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)。从名字上看，该变量是否为某原型的实例。

```js
console.log([] instanceof Array) // true
console.log([] instanceof Object) // true
console.log({} instanceof Object) // true
console.log(function(){} instanceof Function) // true
console.log('' instanceof String) // false
console.log(1 instanceof Number) // false
console.log(true instanceof Boolean) // false
// console.log(undefined instanceof undefined)
// 报错：Right-hand side of 'instanceof' is not an object
// console.log(null instanceof null)
// 报错：Right-hand side of 'instanceof' is not an object
console.log(NaN instanceof Number) // false
console.log(/abc/ instanceof RegExp) // true
console.log(Symbol() instanceof Symbol) // false
console.log(new Date() instanceof Date) // true
console.log(new Map() instanceof Map) // true
console.log(new Set() instanceof Set) // true
console.log(Person instanceof Function) // true
console.log(p instanceof Person) // true
console.log(p instanceof Object) // true
```

`[]`既是数组的实例，又是对象的实例。

可参阅此[文章](https://developer.ibm.com/zh/articles/1306-jiangjj-jsinstanceof/)介绍，这里直接摘取下里面的翻译与代码
```js
function instance_of(L, R) {//L 表示左表达式，R 表示右表达式
  var O = R.prototype;// 取 R 的显示原型
  L = L.__proto__;// 取 L 的隐式原型
  while (true) {
    if (L === null)
      return false;
    if (O === L)// 这里重点：当 O 严格等于 L 时，返回 true
      return true;
    L = L.__proto__;
  }
}
// 上面的代码就很好地解释了，根据原型链的知识，我们知道以下两条等式成立，所以 [] 也是 Object 的实例
[].__proto__ === Array.prototype
Array.prototype.__proto__ === Object.prototype
```
这时候又出现了个问题，`NaN instanceof Number === false`...真是没完没了。按照上面的方法来应该是true的。
其实这个可以跟上面的 `'' instanceof String === false` `1 instanceof Number === false` `true instanceof Boolean === false` 一起看。
NaN也是一个数字值，跟1、2、3这种一样。上面那样写就是返回 false，写出 new 出来的实例就为 true。比如：
```js
const num = new Number(1)
console.log(num instanceof Number) // true
```
**个人理解：**这里的 num 是 Number 的一个实例，但其实它是对象。实例首先肯定是个对象。比如 1 '' true，都是基础类型。上面的方法是站在真正的实例对象来判断，是一个简单化步骤的方法。
但标准里面说的，还有调用内部方法与内部属性，当判断到不是对象，其实就返回 false 了。**这里与 typeof 联系起来，typeof 不是 object 的，用 instanceof 都是 false 了**。

## 四、 Object.prototype.toString.call

```js
console.log(Object.prototype.toString.call([])) // [object Array]
console.log(Object.prototype.toString.call({})) // [object Object]
console.log(Object.prototype.toString.call(function(){})) // [object Function]
console.log(Object.prototype.toString.call('')) // [object String]
console.log(Object.prototype.toString.call(1)) // [object Number]
console.log(Object.prototype.toString.call(true)) // [object Boolean]
console.log(Object.prototype.toString.call(undefined)) // [object Undefined]
console.log(Object.prototype.toString.call(null)) // [object Null]
console.log(Object.prototype.toString.call(NaN)) // [object Number]
console.log(Object.prototype.toString.call(/abc/)) // [object RegExp]
console.log(Object.prototype.toString.call(Symbol())) // [object Symbol]
console.log(Object.prototype.toString.call(new Date())) // [object Date]
console.log(Object.prototype.toString.call(new Map())) // [object Map]
console.log(Object.prototype.toString.call(new Set())) // [object Set]
console.log(Object.prototype.toString.call(Person)) // [object Function]
console.log(Object.prototype.toString.call(p)) // [object Object]
console.log([1,2,3,4].toString()) // 1,2,3,4
```

这个就厉害了，居然精确到每一个都不一样。细看跟 typeof 还有点像，但是精细很多。所以一定也是有个什么内置属性在记录着这个东西。
要写成 `Object.prototype.toString.call` 这个样子，是因为别的原型重写了该方法，比如最后一个数组的 `toString` 方法返回就不一样了。
在控制台打印一个数组看看，就能清晰看到 Array 本身也有一个 `toString` 方法。

简而言之，分两种，一种是对象内置了 `Symbol.toStringTag` 这个属性，来返回 `[object ${tag}]` tag 部分的值。
另外一种是没有这个内置属性，但是 [语言标准tc39](https://tc39.es/ecma262/#sec-object.prototype.tostring) 为其指定了返回 tag，比如：Array String 等这几个老面孔。
这也就意味着可以自定义自己的tag。

{% asset_img Object.prototype.toString.PNG Object.prototype.toString %}
<br/>

```js
console.log(Promise.prototype[Symbol.toStringTag]) // Promise
console.log(Array.prototype[Symbol.toStringTag]) // undefined

function Tag() {}
Tag.prototype[Symbol.toStringTag] = 'newTag'
const t = new Tag
console.log(Object.prototype.toString.call(t)) // [object newTag]

function Tag1() {}
Tag1.prototype[Symbol.toStringTag] = {}
const t1 = new Tag1
console.log(Object.prototype.toString.call(t1)) // [object Object]
// 从上面 tc39 的介绍14，15，16来看，当 [Symbol.toStringTag] 不为 string，则将内置 tag 设置为 Object
```

里面还涉及其他知识，可以参阅 [知乎](https://zhuanlan.zhihu.com/p/118793721) 和 [MDN-Symbol.toStringTag](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag)、[MDN-toString](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)。

码后感：几个判断类型方法，居然有这么多细节点在里面。平时可能用了就用了，都不知道其中原理。真是路漫漫啊。。。
