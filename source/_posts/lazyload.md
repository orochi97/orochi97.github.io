---
title: 简单实现图片懒加载、预加载、分批加载
date: 2020-07-12 00:48:49
categories:
- 开发
- 前端
---

图片我这里是随便找了十张图片，起名 0~9 的名字，方便获取。

**懒加载：**原理就是先放一批空图片占位，当图片进入可视区，再来赋予图片src值，让其显示。
**预加载：**提前请求一批图片资源。下载缓存里。到真的渲染图片时候就可以快速获取到图片。用 new Image() 来请求资源，就不用先创建dom。
**分批加载：**设定一个距离值，在滑动到距离底部小于这个距离值，则请求下一批图片。

分批加载可以与其他两者混用，懒加载与预加载应该不混用了，一个减低服务器压力，一个是增加服务器压力换取体验。

```xml
<!DOCTYPE>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>lazyload</title>
</head>
<style type="text/css">
  #box {
    width: 100%;
    background: black;
    border-radius: 10px;
  }
  ul {
    padding: 0;
    margin: 0;
  }
  li {
    margin: 5px;
    background: gray;
    text-align: center;
  }
  img {
    height: 300px;
    width: auto;
  }
</style>
<body>
<script type="text/javascript">
// 简单防抖
function throttle(fn, time) {
  let timer
  return (ev) => {
    if (timer) {
      return
    }
    timer = setTimeout(() => {
      timer = null
      fn(ev)
    }, time)
  }
}
function getNum(numMin, numMax) {
  return Math.round( Math.random()*(numMax-numMin) + numMin );
}
function getImg (len) {
  const arr = []
  for (let i = 0; i < len; i++) {
    arr.push(getNum(0, 9))
  }
  // 模拟异步获取图片资源
  return Promise.resolve(arr)
}
window.onload = function () {
  const $ui = document.querySelector('#box ul')
  const loading = './img/loading.gif'
  const distance = 20
  function initImg() {
    return getImg(5).then((imgs) =>{
      imgs.forEach((img) => {
        const url = `./img/${img}.JPG`
        // 先预加载，演示一下，不然这里懒加载没什么意义了，都是发了请求
        // 用一个img对象来先对资源进行请求
        const imgObj = new Image()
        imgObj.src = url
        // 创建图片dom
        const $li = document.createElement('li')
        $ui.appendChild($li)
        const $img = document.createElement('img')
        $img.src = loading
        $img.dataset.src = `./img/${img}.JPG`
        $li.appendChild($img)
      })
    })    
  }
  function checkImg() {
    const $imgs = document.querySelectorAll('#box li img')
    $imgs.forEach((dom) => {
      const dataSrc = dom.getAttribute('data-src')
      // 此top为该元素距离窗口顶部距离，
      // 所以直接判断该值是否小于窗口可视区的值，即在可视区内
      const { top } = dom.getBoundingClientRect()
      // 先判断有没有data-src，防止不断修改图片src
      if (dataSrc && (top < window.innerHeight)) {
        dom.src = dataSrc
        dom.removeAttribute('data-src')
      }
    })
  }
  window.addEventListener('scroll', throttle(function(ev) {
    // 距离底部还有20px
    const { scrollTop, clientHeight, offsetHeight } = document.documentElement
    if (offsetHeight - ( scrollTop + clientHeight ) < distance) {
      initImg()
    }
    checkImg()
  }, 200))
  // 进行首次的资源获取
  initImg().then(() => {
    checkImg()
  })
}
</script>
<div id="box">
  <ul></ul>
</div>
</body>
</html>
```

除此之外还有个 api 专门来处理这种可视回调的[IntersectionObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver)。
具体可参阅下[阮老师的文章](http://www.ruanyifeng.com/blog/2016/11/intersectionobserver_api.html)。
