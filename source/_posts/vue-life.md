---
title: vue生命周期
date: 2020-07-26 12:00:16
categories:
- 开发
- 前端
---

对于 vue 的几个生命周期老是记不住，应该还是理解不够透彻，这里记录一下。

代码与注释参考了 [segmentfault](https://segmentfault.com/a/1190000011381906) 和 [imooc](https://www.imooc.com/article/293328) 这两篇文章，感谢。

```xml
<!DOCTYPE>
<html>
<head>
  <title></title>
  <script type="text/javascript" src="https://cdn.jsdelivr.net/vue/2.1.3/vue.js"></script>
</head>
<body>
<div id="app">
  <p>{{ message }}</p>
  <a @click="change">change</a>
  <a @click="destroy">destroy</a>
  <span v-if="false"></span>
</div>
<script type="text/javascript">
var i = 0
var app = new Vue({
  // render > template > el，但 el 不能缺少
  el: '#app',
  // template: '<div id="app">{{message1}}</div>',
  // render: function(createElement) {
  //   const menu_items = ["首页","搜索","分类","系统"]
  //   return createElement('ul', 
  //     menu_items.map(item => {
  //       return createElement('li', {
  //         class: {
  //           'uk-nav': true
  //         },
  //         domProps: {
  //           innerHTML: item
  //         }
  //       })
  //     })
  //   )
  // },
  data: {
    message : 'init',
    message1 : 'ok'  
  },
  methods: {
    change () {
      this.message = 'ok' + i++
    },
    destroy () {
      this.$destroy()
    }
  },
  beforeCreate: function () {
    // 创建实例前，此时虚拟dom和属性全都拿不到
    // 主要就是给vm对象添加了 $parent、$root、$children 属性，以及一些其它的生命周期相关的标识
    // 初始化事件相关的属性
    // vm 添加了一些虚拟 dom、slot 等相关的属性和方法
    console.info('beforeCreate 创建前状态===============》')
    console.log('%c%s', 'color:red' , 'el     : ' + this.$el) //undefined
    console.log('%c%s', 'color:red','data   : ' + this.$data) //undefined 
    console.log('%c%s', 'color:red','message: ' + this.message) //undefined 
  },
  created: function () {
    // 初始化，可以拿到属性，应该是完成了数据劫持，但dom依旧拿不到
    // props、methods、data、watch、computed等数据初始化
    console.info('created 创建完毕状态===============》')
    console.log('%c%s', 'color:red','el     : ' + this.$el) //undefined
    console.log('%c%s', 'color:red','data   : ' + JSON.stringify(this.$data)) //已被初始化 
    console.log('%c%s', 'color:red','message: ' + this.message) //已被初始化
  },
  beforeMount: function () {
    // 根据el和template属性来初始化dom
    console.info('beforeMount 挂载前状态===============》')
    console.log('%c%s', 'color:red','el     : ' + (this.$el)) //已被初始化
    // 这里的dom还没进行模板替换，也就是还显示着 {{message}} 这种占位符，span 元素也还在
    // 这里就算有 template render，也是出现 outer html
    console.log(this.$el)
    console.log('%c%s', 'color:red','data   : ' + this.$data) //已被初始化  
    console.log('%c%s', 'color:red','message: ' + this.message) //已被初始化 
  },
  mounted: function () {
    // 完成挂载，{{message}} 被数据替换，span 元素也被移除
    console.info('mounted 挂载结束状态===============》')
    console.log('%c%s', 'color:red','el     : ' + this.$el) //已被初始化
    console.log(this.$el)    
    console.log('%c%s', 'color:red','data   : ' + this.$data) //已被初始化
    console.log('%c%s', 'color:red','message: ' + this.message) //已被初始化 
  },
  beforeUpdate: function () {
    console.info('beforeUpdate 更新前状态===============》')
    console.log('%c%s', 'color:red','el     : ' + this.$el)
    // 这里的dom还是旧的
    console.log(this.$el)   
    console.log('%c%s', 'color:red','data   : ' + JSON.stringify(this.$data))
    // 数据已更新,，这里修改数据会引起死循环
    console.log('%c%s', 'color:red','message: ' + this.message)
  },
  updated: function () {
    console.info('updated 更新完成状态===============》')
    console.log('%c%s', 'color:red','el     : ' + this.$el)
    // dom已更新，这里修改数据会引起死循环
    console.log(this.$el) 
    console.log('%c%s', 'color:red','data   : ' + this.$data) 
    console.log('%c%s', 'color:red','message: ' + this.message)
  },
  beforeDestroy: function () {
    // 所有东西还在
    console.info('beforeDestroy 销毁前状态===============》')
    console.log('%c%s', 'color:red','el     : ' + this.$el)
    console.log(this.$el)    
    console.log('%c%s', 'color:red','data   : ' + this.$data) 
    console.log('%c%s', 'color:red','message: ' + this.message)
    this.message = 'destroy'
  },
  destroyed: function () {
    // 数据绑定被卸除，监听被移出，子实例也统统被销毁，dom保留着
    console.info('destroyed 销毁完成状态===============》')
    console.log('%c%s', 'color:red','el     : ' + this.$el)
    console.log(this.$el)  
    console.log('%c%s', 'color:red','data   : ' + this.$data) 
    console.log('%c%s', 'color:red','message: ' + this.message)
    setTimeout(() => {
      // 实例还在
      console.log('vue 实例===============》', app)
    }, 1000)
  }
})
</script>
</body>
</html>
```