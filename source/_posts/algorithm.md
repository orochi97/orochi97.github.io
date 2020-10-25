---
title: 记录一些基础算法
date: 2020-10-21 23:51:13
updated: 2020-10-25 11:51:18
categories:
- 开发
- 算法
---

开始补充一些算法和数据结构的知识

### 冒泡排序

```js
const arr = [162, 6, 3, 8, 90, 234, 5, 7, 31, 45, 12, 1, 98, 23, 87, 40]
function sort(arr) {
  const len = arr.length - 1
  for (let x = 0, y = len; x < y; x++) {
    // 把第一个跟后面那个对比，如果比后面的数大，就交换位置，到最后就可以确定最大的数在最后
    // 也就是在 length 的位置
    // 在第一轮的时候，x=1，也就是遍历到倒数第二个就好，因为取到 i+1 的数
    for (let i = 0, l = len - x; i < l; i++) {
      const first = arr[i], second = arr[i+1]
      if (first > second) {
        [arr[i], arr[i+1]] = [second, first]
      }
    }
    // 假设没有第一层，最大的数已经在最后，那么第二轮就是要在剩下的数找到最大，并放到倒数第二位置
    // 也就是在 length-1 的位置
    // 此时 x=2，因为依然是当轮最后数（第二轮为length-1）的前一个
    // for (var i = 0, l = arr.length - 2; i < l; i++) {
    //  if (arr[i] > arr[i+1]) {
    //    [arr[i], arr[i+1]] = [arr[i+1], arr[i]]
    //  }
    // }
    // 第三轮 x=3
    // for (var i = 0, l = arr.length - 3; i < l; i++) {
    //  if (arr[i] > arr[i+1]) {
    //    [arr[i], arr[i+1]] = [arr[i+1], arr[i]]
    //  }
    // }
    // 第四轮 x=4
    // for (var i = 0, l = arr.length - 4; i < l; i++) {
    //  if (arr[i] > arr[i+1]) {
    //    [arr[i], arr[i+1]] = [arr[i+1], arr[i]]
    //  }
    // }
    // 所以循环个遍，就成了外面一层的循环
  }
  return arr
}
console.log(sort(arr))
```

### 二分法

就是在一个有序的序列中迅速找到要找的那个数的索引。一个一个遍历当然也可以找到，但是不确定性导致复杂度。
二分法就是中间砍一刀，这样数列就成了两半。看看中间值是不是，是那就刚好了。不是的话，判断目标数是在前一半还是后一半，如此这般的循环即可。

这种思想应该在现实生活中还是经常用到的，比如`git bisect`（[看看大佬的介绍](http://www.ruanyifeng.com/blog/2018/12/git-bisect.html)）。
以及，让我想起以前 TVB 的《超级无敌掌门人》里面有个游戏叫“超级无敌开口中”，轮流在在100里面瞎说一个数，中了就受罚。特别是轮到说最后一个必中的数字时那种视死如归的神情，超搞笑。

```js
function getRandomNum(numMin, numMax) {
  return Math.round( Math.random()*(numMax-numMin) + numMin )
}  
function getArr() {
  const arr = []
  for(let i = 1, l = 100; i <= l; i++) {
    arr.push(i)
  }
  return arr
}
// 随机生成 1 ~ 100 中的某数
const num = getRandomNum(1, 100)
// 生成 1 - 100 的数组
const arr = getArr()
function binarySearch(num, arr) {
  let start = arr.length
  let end = 0
  const getHalf = () => {
    let length = start + end
    return (length % 2 === 0) ? (length / 2) : (length + 1) / 2
  }
  // 取中值
  let half = getHalf()
  let current = arr[half]
  while (current !== num) {
    if (current > num) {
      start = half
    } else if (current < num) {
      end = half
    }
    half = getHalf()
    current = arr[half]
  }
  return half
}
const idx = binarySearch(num, arr)
console.log(idx, arr[idx], num)
```

### 斐波那契数列

具体的数学意义就不说了，我也不懂，总而言之是满足这样的一个数列：F(0)=0，F(1)=1，F(n)=F(n - 1)+F(n - 2)（n ≥ 3，n ∈ N*）

```js
// 第一反应就是递归，最简单最明晰。但效率最低，其实就是每次算出来的值没存起来，导致每个 n 位的值传进去都要重新递归的算
function fibonacci(n) {
  if(n === 0 || n === 1) {
    return n
  }
  return fibonacci(n-1) + fibonacci(n-2)
}
// 改进一些，是个数列自然就可以用个数组来存
// 把之前获得 n 位的值存起来，下次要拿就直接取就好
function fibonacci2(n) {
  if(n === 0 || n === 1) {
    return n
  }
  const arr = [0, 1]
  for(let i = 2; i <= n; i++) {
    arr[i] = arr[i-1] + arr[i-2]
  }
  return arr[n]
}
// 改进一些，其实每次都是需要上两位就可以了，不需要用整个数组来存全部
function fibonacci3(n) {
  if(n === 0 || n === 1) {
    return n
  }
  let lastOne = 1 // n-1
  let lastTwo = 0 // n-2
  for(let i = 2; i <= n; i++) {
    var current = lastOne + lastTwo
    // n-2 和 n-1 分别获取后一位的值
    lastTwo = lastOne
    lastOne = current
  }
  return current
}
// 第一种递归的方法，在浏览器 40 以后基本快跑不出来了
// 第三种还是比第二种快那么些许
console.time('fibonacci')
console.log(fibonacci(40))
console.timeEnd('fibonacci')
```