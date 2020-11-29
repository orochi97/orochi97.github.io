---
title: 几个相似（splice slice，substr substring）方法的区别
date: 2020-11-29 23:15:36
categories:
- 开发
- 前端
---

数组有 splice，slice 这两个方法，字符串也有类似的，长得很像，经常混了，这里记录下。

#### arrayObject.splice(index, howmany, item1, ....., itemX)

splice：绞接，捻接(两段绳子)的意思。该方法向/从数组中添加/删除项目，然后返回被删除的项目。该方法会直接对数组进行修改。

index：必需。整数，规定添加/删除项目的位置，使用负数可从数组结尾处规定位置。
howmany：必需。要删除的项目数量。如果设置为 0，则不会删除项目。
item1, ..., itemX：可选。向数组添加的新项目。
```js
const arr = [1, 2, 3, 4]
arr.splice(2, 0, 7, 7, 7) // 返回[]，arr = [1, 2, 7, 7, 7, 3, 4]
arr.splice(2, 1, 7, 7, 7) // 返回[3]，arr = [1, 2, 7, 7, 7, 4]
arr.splice(0, 1) // 返回[1]，arr = [2, 3, 4]
arr.splice(-1, 1, 7, 7, 7) // 返回[4]，arr = [1, 2, 3, 7, 7, 7]
```

#### arrayObject.slice(start, end)

slice：切片的意思。该方法可从已有的数组中返回选定的元素。返回一个新的数组，包含从 start 到 end （不包括该元素）的 arrayObject 中的元素。不会改变原数组。

start：必需。规定从何处开始选取。如果是负数，那么它规定从数组尾部开始算起的位置。也就是说，-1 指最后一个元素，-2 指倒数第二个元素，以此类推。
end：可选。规定从何处结束选取。该参数是数组片断结束处的数组下标。如果没有指定该参数，那么切分的数组包含从 start 到数组结束的所有元素。如果这个参数是负数，那么它规定的是从数组尾部开始算起的元素。
```js
const arr = [1, 2, 3, 4]
arr.slice(0, 0) // []
arr.slice(0, 1) // [1]
arr.slice(2, 3) // [3]
arr.slice(0) // [1, 2, 3, 4]
arr.slice(-2) // [3, 4]
arr.slice(-2, -1) // [3]
```

字符串的 slice，substr，substring 方法

#### stringObject.slice(start, end)
该方法可提取字符串的某个部分，并以新的字符串返回被提取的部分。跟数组一样不赘述
```js
'1234567'.slice(1, 3) // 23
'1234567'.slice(-4, -1) // 456
```

#### stringObject.substr(start, length)
该方法可在字符串中抽取从 start 下标开始的指定数目的字符。
***注意：ECMAscript 没有对该方法进行标准化，因此反对使用它。***

start：必需。要抽取的子串的起始下标。必须是数值。如果是负数，那么该参数声明从字符串的尾部开始算起的位置。也就是说，-1 指字符串中最后一个字符，-2 指倒数第二个字符，以此类推。
length：可选。子串中的字符数。必须是数值。如果省略了该参数，那么返回从 stringObject 的开始位置到结尾的字串。
```js
'1234567'.substr(1, 3) // 234
'1234567'.substr(0) // 1234567
'1234567'.substr(-4, 2) // 45
```

#### stringObject.substring(start, stop)
该方法用于提取字符串中介于两个指定下标之间的字符。

start：必需。一个非负的整数，规定要提取的子串的第一个字符在 stringObject 中的位置。
stop：可选。一个非负的整数，比要提取的子串的最后一个字符在 stringObject 中的位置多 1。如果省略该参数，那么返回的子串会一直到字符串的结尾。

***注意：与 slice 和 substr 方法不同的是，substring 不接受负的参数。substring 功能与 slice 一样。***
```js
'1234567'.substring(1, 3) // 23
'1234567'.substring(3, 1) // 23，如果 start 比 stop 大，那么该方法在提取子串之前会先交换这两个参数。
'1234567'.substring(3) // 4567
'1234567'.substring(-1, 1) // 1，参数 -1 被解析成 0
```
