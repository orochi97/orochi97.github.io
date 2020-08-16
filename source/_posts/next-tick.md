---
title: vue的nextTick解析
date: 2020-08-16 21:20:00
tags:
---

用过 vue 的同学应该都知道，双向绑定中，更改了数据会去更新dom，但不是马上更新的。
直接跟在修改数据后，拿到的 dom 还是旧的。
vue有个`this.$nextTick`用法，用这个的回调可以保证拿到更新后的dom。

直接看看 [next-tick](https://github.com/vuejs/vue/blob/dev/src/core/util/next-tick.js) 源码
```js
import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false
const callbacks = []
let pending = false

// 清异步队列，全部执行
function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}
let timerFunc
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  // 判断有没有 promise 且有没有被重写过，
  // promise完好无损就使用 promise 做异步队列的触发，设置使用微任务标志为true
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  // 特殊场景用MutationObserver
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Techinically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  // 再不济看看有没有 setImmediate，虽然也是宏任务，但总比 setTimeout 强
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  // 实在没办法了，setTimeout 兜底
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
// nextTick 具体操作所在，其他队列方法也是用这个，比如 data 改动后通知 dom 修改，也是用这个
// 即 vue 里面的响应式，不是实时更新的，而是存在一个队列，在下一回合进行任务更新。不然太耗损性能
// 也就是解释了，在修改了 data 之后，dom 是没有马上更新，而在 $nextTick 的回调后，则可以看到 dom 更新
// 原因就在于同样的异步任务，$nextTick 的回调，是在 dom 修改的操作后面，所以 $nextTick 能看到 dom 更新
// 以下以 this.$nextTick(()=>{}) 为例子，cb 为回调，ctx 为 vue 实例
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  // 把任务塞进异步队列
  callbacks.push(() => {
    // 有回调就触发回调
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      } 
      // 这里注意，结合下面来看
      //用 promise 的 resolve 触发，把 vue 实例当成参数传进去
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  // 在清任务 flushCallbacks 里赋值 pending 为 false
  // 目的为了 timerFunc 在周期内只触发一次
  // 执行 timerFunc，让其下一周期执行清异步队列任务
  if (!pending) {
    pending = true
    timerFunc()
  }
  // 当没有回调且 Promise 正常
  // $nextTick 返回的是一个 promise，触发时机与上面有回调一样
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
```

除了常规的回调用法之外，还可以这样用
```js
this.$nextTick().then( vue实例 => { console.log(vue实例 === this) }) // => true
```

如果不传入回调，则返回promise，因为是 promise，也可以直接就 await 等待。参考[官网](https://cn.vuejs.org/v2/guide/reactivity.html#%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0%E9%98%9F%E5%88%97)。

接着来个简陋版简单模拟一下这个 nextTick 的实现。这其中还涉及到[事件循环](/2020/05/27/eventloop/)的知识。
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