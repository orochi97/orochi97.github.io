---
title: 前端性能监控
date: 2021-01-09 21:52:41
updated: 2023-03-06 21:51:09
categories:
- 开发
- 前端
tags:
- 性能
---

前端性能参数，可以直接敲 `performance`。里面记录了各个性能指标。具体的各个参数，可以查看大佬们的[总结](http://www.alloyteam.com/2015/09/explore-performance/#prettyPhoto)。

这里记录几个参数

#### 1、首屏绘制（First Paint，FP）
就是白屏时间啦。
```js
performance.getEntriesByType('paint')[0]
```

#### 2、首屏内容绘制（First Contentful Paint，FCP）
就是首屏加载时间啦
```js
performance.getEntriesByType('paint')[1]
```

<!--more-->

#### 3、可交互时间（Time to Interactive，TTI）
用户开始可操作时间，需要满足两个条件（资料来源于网上）：
> 第一个条件是主线程的长任务（长任务是指耗时超过 50 ms）执行完成后，第二个条件是随后网络静默时间达到 5 秒，这里的静默时间是指请求数不超过 2 个， 排除失败的资源请求和未使用 GET 方法进行的网络请求。
```js
// 需要借助谷歌提供的库
import ttiPolyfill from 'tti-polyfill'; 
ttiPolyfill.getFirstConsistentlyInteractive(opts).then((tti) => {});
```

这个对象虽然可以获取到各个数值，但是不知道何时调用，也就是不知道什么时候完成，才能获取到这个数值。可以用另外一个 `PerformanceObserver` 对象做事件监听。
实例代码来源于网上
```js
let perfomanceMetrics = {}
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // `entry` is a PerformanceEntry instance.
    // `name` will be either 'first-paint' or 'first-contentful-paint'.
    // 注意 first-paint 和 first-contentful-paint 的 entryType 都是 paint
    const metricName = entry.name
    const time = Math.round(entry.startTime + entry.duration)
    if (metricName === 'first-paint') {
      perfomanceMetrics.fp = time
    }
    if (metricName === 'first-contentful-paint') {
      perfomanceMetrics.fcp = time
    }
  }
  console.log(perfomanceMetrics) 
})
// Start observing the entry types you care about.
observer.observe({entryTypes: ['paint']})
```

这里还多了两个参数指标。

**顺着上面的监听方式，再看看下面两个指标的获取：**

#### 4、总阻塞时间（Total Blocking Time，TBT）
> 是指阻塞用户响应（比如键盘输入、鼠标点击）的所有时间。指标值是将 FCP 之后一直到 TTI 这段时间内的阻塞部分时间总和，阻塞部分是指长任务执行时间减去 50 毫秒。
```js
// 可以简单看长任务的总耗时
observer.observe({ entryTypes: ['longtask'] })
```

#### 5、最大内容绘制（Largest Contentful Paint，LCP)
> 最大内容绘画指的是视口内可见的最大图像或文本块的绘制时间。
```js
observer.observe({entryTypes: ['largest-contentful-paint']})
```

这个可以一开始就进行监听，到事件触发自动记录数据。

performance 对象还可以用来打点，得到的数值比时间戳精度高
```js
performance.mark('first paint time')
document.addEventListener('DOMContentLoaded', ()=> {
    performance.mark('dom ready')
})
window.onload = function() {
  performance.mark('page loaded')

  // ByName，就是自己打的点
  const fp = performance.getEntriesByName('first paint time')[0]
  console.log('first paint time: ', fp)

  const domReady = performance.getEntriesByName('dom ready')[0]
  console.log('dom ready: ', domReady)

  const pageLoad = performance.getEntriesByName('page loaded')[0]
  console.log('page loaded: ', pageLoad)

  // ByType，浏览器自己的类型，paint 包含了 first-paint、first-contentful-paint
  const paint = performance.getEntriesByType('paint')
  console.log('paint: ', paint)
}
```

总结一下，这里只是列了一些基础的性能指标，供自己记录一下。

对于以前的网站写法，可以用 `window.onload` 和 `DOMContentLoaded` 的回调时机来收集数据。但是对于现在的单页面应用，都是加载了页面，再执行 js 进行渲染，这两个时机就容易不准确了。用成 `PerformanceObserver` 方法会好一点。
