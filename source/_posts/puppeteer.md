---
title: 玩一玩puppeteer
date: 2020-08-30 17:48:13
categories:
- 开发
- 前端
---

[puppeteer](https://zhaoqize.github.io/puppeteer-api-zh_CN/)官网上写着：

> Puppeteer 是一个 Node 库，它提供了一个高级 API 来通过 DevTools 协议控制 Chromium 或 Chrome。Puppeteer 默认以 headless 模式运行，但是可以通过修改配置文件运行“有头”模式。

其实就是个浏览器，给了许多方法让我们可以控制这个浏览器，比如打开某某网页，输入什么字符，点击哪个按钮。看起来就像是用程序来模拟人工的行为。
这样就表示了它可以用来自动化测试。搭配 jest 或 mocha 之类的测试框架，进行e2e测试，模拟一个人去访问网站，进行一些操作。
当然不止这一个方案，还有 [selenium](http://www.selenium.org.cn/) 和在这之上的 [night-watch](https://nightwatchjs.org/)，也是干 web 自动化测试的活。

我们项目上使用它来跑自动化测试的，我自己用它来做爬虫，奸笑~
可能也不叫爬虫，就是上新闻网站扫一下热搜，到图片库搜点图片之类的。

### 安装：
安装是个蛋疼的事，因为这个用到chromium，这玩意在谷歌仓库。所以如果不能科学上网，那就只能修改为淘宝源。
```bash
env puppeteer_download_host=https://npm.taobao.org/mirrors npm i puppeteer

npm config set puppeteer_download_host  https://npm.taobao.org/mirrors
npm i puppeteer
```
年代久远，记得都是可以的。不保证时效性...

我们项目一开始使用它来截图
```js
const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({
    headless: true // 无头就是不要弹出浏览器
  })
  const page = await browser.newPage()
  await page.goto('https://www.baidu.com')
  await page.setViewport({
    width: 1200,
    height: 800
  })
  await page.screenshot({
    path: 'puppeteer.png',
    fullPage: true
  })
  await browser.close()
})()
```
来看下用它来搜百度热搜，之所以对 puppeteer 感兴趣，就是同事写了一篇这个教程，里面就是演示了爬热搜。
```js
const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({
    headless: true // 无头就是不要弹出浏览器
  })
  const page = await browser.newPage()
  await page.goto('http://top.baidu.com/buzz?b=1&fr=topindex', {
    timeout: 0, // 设置超时时间为0
    waitUntil: 'domcontentloaded' // 有多个状态可设置，这里设置为 dom 渲染完成
  })
  // 有时候网速卡，加载慢，容易超时报错，所以上面把超时时间去掉
  // 同时网页渲染也需要时间，可以等一下，
  // 比如 await page.waitFor(1000) 等待1000ms
  // 比如我之前爬图片的时候，都知道图片是相当耗时的
  // 所以我写成等图片的 dom 可见即可，可见包括了它已经被赋予 src，不需要等到图片下载并渲染完成
  // 然后获取其 src，再通过别的方法下载
  // await page.waitForSelector(dom, { visible: true, timeout: 0 })
  const list = await page.evaluate((dom) => {  // 爬取内容
    // 这个 dom 需要去网站上看实际结构，很好找，跟 jQuery 一样
    const $doms = document.querySelectorAll('.mainBody .keyword a')
    const list = Array.from($doms).map(($dom) => {
      return {
        href: $dom.href,
        text: $dom.innerText
      }
    })
    return list
  })
  // 这个 list 就记录了热搜的标题和网址
  await page.close()
  await browser.close()
})()
```

对网页的抓取还有这个[cheerio](https://github.com/cheeriojs/cheerio/wiki/Chinese-README)，在 node 里面像 jQuery 一样获取dom。
不过好像对单页面的网站比较麻烦。因为是抓了整个网页内容下来，再来分析页面。那对于 SPA 抓下来也是一个容器一个js，没有实体dom。所以具体看用途啦。

puppeteer还有很多牛的功能，这里只是用到了冰山一角，还能做更多有趣的事。
