---
title: vue 的里 observer、dep、watcher
date: 2022-11-07 23:13:16
categories:
- 开发
- 前端
---

简单梳理一下 vue 源码里，observer、dep、watcher 这三者的作用，捋清了基本上就知道 vue 的响应式操作了。看一张图：

![vue-observer-dep-watcher.jpg](https://file.cchealthier.com/file/blog/202210/vue-observer-dep-watcher.png)

总结一下就是，我们在 vue 文件定义数据 data 属性，会生成一个 _data 的对象，遍历这个 _data 对象的属性，会通过 defineProperty 挂载到 vue 实例上。以图里 src 为例：

* vm.src，被 defineProperty 处理
* => 读取和设置都是 vm._data.src
* => vm._data.src 被 defineProperty 处理
* => 在其 set get 函数进行依赖收集即更新通知

##### 再细述两个小点

1. 原来 dom 的更新是在 watcher 的 getter 里。watcher 有两种，一种是在实例上声明的 watch 对象或者主动调用 vm.$watch 方法的，这种都是属性 user=== true 的 watcher，其 getter 都是直接获取 vm 上的值。一种是生命周期由框架生成的 watcher，这个的 getter 是 updateComponent，里面包含了对 dom 的更新。当然接下来就是 diff 算法更新 dom 的事了，不属于依赖更新的内容。

2. vue 文件的 template 代码会被解析成 render 函数，对，就是那个说直接写会效率更快的 render 函数。原过程是：template => ast => render，这一步还是比较消耗。直接写 render 函数相当于省去前面两步。然后 render 执行后会生成虚拟 dom，也就是 VNode。接下来就是 vm._patch_ 里通过双指针的 diff 算法，来对比新旧 VNode 的差别，算出变更的地方，然后执行 js 原生的元素操作语句进行 dom 的修改。


