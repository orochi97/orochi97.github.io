---
title: 垂直居中的几个方法
date: 2020-07-29 22:30:18
categories:
- 开发
- 前端
---

四种方法，先在外面放四个容器, 赋予 “.container” 类。让其子元素居中，先赋予 “.box” 类，水平居中。

```xml
<!DOCTYPE>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>baidu</title>
</head>
<style type="text/css">
.container {
  width: 22%;
  height: 300px;
  float: left;
  background-color: #abcdef;
  margin: 0 10px;
  position: relative;
}
.box {
  width: 100px;
  height: 100px;
  background-color: red;
  text-align: center;
}
<!-- 绝对定位大法，设置为绝对定位，四个方向位移为0，外边距设为auto -->
.middle1 {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
}
<!-- flex弹性布局，特别容易完成这个事 -->
.middle2 {
  display: flex;
  justify-content: center;
  align-items: center;
}
<!-- 利用表格居中，注意的是还要多一层table-cell，真正居中是在table-cell -->
.middle3 {
  display: table-cell;
  vertical-align: middle;
  background-color: initial;
}
.block {
  display: inline-block;
}
<!-- 绝对定位加translate大法，水平垂直位移50%，translate里面的50%是相对于自己的，所以不知宽高也可以使用 -->
.middle4 {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
}
</style>
<body>
<div class="container"><div class="box middle1"></div></div>
<div class="container middle2"><div class="box"></div></div>
<div class="container" style="display: table;">
  <div class="box middle3">
    <p class="box block"></p>
  </div>
</div>
<div class="container"><div class="box middle4"></div></div>
</body>
</html>
```

总结：个人觉得，首先 [flex](http://www.ruanyifeng.com/blog/2015/07/flex-grammar.html) 布局最方便也最帅气。然后绝对定位加 [translate](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/translate) 也好理解。至于第一种绝对定位加四个方向位移为0，其实不太理解其原理~ = =！