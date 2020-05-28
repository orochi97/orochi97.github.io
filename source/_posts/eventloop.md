---
title: JS 事件循环
date: 2020-05-27 22:45:46
categories:
- 开发
- 前端
---

### web：

**1、**
浏览器有多线程，GUI渲染线程，定时器线程，IO线程（ajax）线程，事件触发线程，js线程。
**2、**
对于js而言，是单线程，一条线走到底。其他线程都是异步任务，处理把回调推入任务队列。
**3、**
js开始运行，把同步任务一个个入栈执行，这其中由于同步任务产生的异步回调都进入
任务队列了。执行完毕后，栈空。开始查询异步队列，一个个压入栈再执行，直至清空队列，其中过程再产生异步任务再次推入异步队列。不断循环的检查任务队列，执行任务队列的任务，压入任务队列。
其中任务队列有细分有宏任务，微任务。
**4、**
优先执行微任务，并且微任务清一列，宏任务清一个。
**5、**
同步任务执行可以看做第一个宏任务执行完毕。接着清空微任务队列，清一个宏任务，接着再清空微任务队列，再继续清一个宏任务，不断循环，直到没有，也可以看成微任务只有一列但是一列有多个，宏任务有多列但是一列只有一个。这是js的事件循环机制。
**6、**
属于微任务（microtask）的事件有以下几种：
Promise.then
MutationObserver
Object.observe
process.nextTick
**7、**
属于宏任务（macrotask）的事件有以下几种：
setTimeout
setInterval
setImmediate
MessageChannel
requestAnimationFrame
I/O
UI交互事件

```js
setTimeout(() => {
  console.log('宏任务--1')
  Promise.resolve()
  .then(() => {
    console.log('微任务2--1')
  })
  .then(() => {
    console.log('微任务2--2')
    setTimeout(() => {
      console.log('宏任务--3')
    })
  })
})
console.log('同步任务--1')

new Promise((resolve) => {
  console.log('同步任务--2')
  resolve()
}).then(() => {
  console.log('微任务1--1')
})

Promise.resolve().then(() => {
  console.log('微任务1--2')
})
setTimeout(() => {
  console.log('宏任务--2')
  Promise.resolve().then(() => {
    console.log('微任务3--1')
  })
  setTimeout(() => {
    console.log('宏任务--4')
  })
})
console.log('同步任务--3')
console.log('同步任务--4')
```
<br>
{% asset_img web.PNG web %}
<br>

### Node：

https://nodejs.org/zh-cn/docs/guides/event-loop-timers-and-nexttick/

**1、**
node的事件分阶段来循环，
timers -> IO callbacks -> idle, prepare -> poll(incoming) -> check -> close
**2、**
入口在poll阶段，每个阶段都有自己的队列
**3、**
__定时器：__本阶段执行已经被 setTimeout() 和 setInterval() 的调度回调函数。
__待定回调：__执行延迟到下一个循环迭代的 I/O 回调。
__idle, prepare：__仅系统内部使用。
__轮询：__检索新的 I/O 事件;执行与 I/O 相关的回调（几乎所有情况下，除了关闭的回调函数，那些由计时器和 setImmediate() 调度的之外），其余情况 node 将在适当的时候在此阻塞。
__检测：__setImmediate() 回调函数在这里执行。
__关闭的回调函数：__一些关闭的回调函数，如：socket.on('close', ...)。
**4、**
轮询（poll）阶段有两个重要的功能：
计算应该阻塞和轮询 I/O 的时间。
然后，处理 轮询 队列里的事件。
这里会循环到清楚队列任务，或者达到node限制
**5、**
每个阶段结束都会查询清空process.nextTick的回调队列

```js
const fs = require('fs')
fs.readFile('lib.js', () => {
  setTimeout(() => {
    console.log('cb setTimeout--1')
  }, 0)
  setImmediate(() => {
    console.log('cb setImmediate--1')
  })
})

process.nextTick(() => {
  console.log('nextTick--1')
})
setImmediate(() => {
  console.log('setImmediate--1')
})
setTimeout(() => {
  console.log('setTimeout--1')
  process.nextTick(() => {
    console.log('nextTick--3')
  })
}, 0)
console.log('script--1')

Promise.resolve().then(() => {
  console.log('resolve then--1')
})
new Promise((resolve) => {
  console.log('Promise--1')
  resolve()
}).then(() => {
  console.log('then--1')
  process.nextTick(() => {
    console.log('nextTick--3')
  })
})

setTimeout(() => {
  console.log('setTimeout--2')
  Promise.resolve().then(() => {
    console.log('setTimeout -- resolve then--1')
  })
  setImmediate(() => {
    console.log('setImmediate--3')
  })
}, 0)
console.log('script--3')
console.log('script--4')

process.nextTick(() => {
  console.log('nextTick--2')
  setImmediate(() => {
    console.log('setImmediate--2')
  })
})
```
<br>
{% asset_img node.PNG node %}
<br>

### 絮
知道js的循环机制和宏任务微任务的概念后，就可以知道vue的$nextTick原理，为什么在改变变量后，$nextTick的回调里可以保证dom已经更新完毕。来个简陋版的模拟。
```js
// 模拟vue nextTick
// 存储所有$nextTick的回调，变量的set修改后通知dom更新的，与$nextTick的回调进入同个微队列
const callbacks = []
// 微队列的触发载体，这里是Promise.resolve()
// vue是先找Promise.resolve，没有就找setTimeout
let run = null

function next() {
  callbacks.forEach((cb) => {
    cb()
  })
}
// 这里的change可以看成修改了变量，里面的回调就是与nextTick的回调如出一辙
function change() {
  nextTick(() => {
    // 这里面是同步
    console.log('update dom -- 1')
    const child = document.createElement('div')
    child.id = 'new'
    document.getElementById('box').appendChild(child)
    console.log('update dom')
    console.log('update dom -- 2')
  })
}

function nextTick(cb) {
  if(!run) {
    // 初始化下个队列
    run = Promise.resolve()
    // 把next方法放在下个队列运行
    // 看上面的next函数，是把callbacks的函数遍历执行
    run.then(next)
  }
  // nextTick的回调加入数组等着，遍历触发里面的每个函数
  // 由于是同步，所以其实只是一个微任务，
  callbacks.push(cb)
}

// 调用了第一次nextTick
nextTick(() => {
  // 表示该次微队列任务开始
  console.log('nextTick -- 1')
})
Promise.resolve().then(() => {
  console.log('then -- ')
})
// 修改变量，更改了dom
change()
// 同步任务，最早打印，但此时没有new元素
console.log('script -- ', document.getElementById('new'))
// 调用了第二次nextTick
nextTick(() => {
  // 在修改变量之后调nextTick，已有new元素
  console.log('nextTick -- 2', document.getElementById('new'))
})
// nextTick -- 2 之所以在 then -- 前打印，是因为回调都放在callbacks里，同步触发了
```
<br>
{% asset_img next.PNG next %}
<br>
