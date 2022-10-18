---
title: 深度优先遍历(DFS)-栈和广度优先遍历(BFS)-队列的理解
date: 2020-11-15 10:41:59
updated: 2022-10-18 21:31:18
categories:
- 开发
- 算法
---

JS版本的，概念什么的就不赘述了。参考了这位大佬的[文章（JS算法之深度优先遍历(DFS)和广度优先遍历(BFS)）](https://segmentfault.com/a/1190000018706578)。
在这里记录下自己的理解，为啥一个是栈，一个是队列。看码：

```html
<div id="box">
  <ul>
    <li><div><p></p></div></li>
    <li><img /></li>
    <li><a></a></li>
  </ul>
  <div>
    <p>1</p>
    <p><span><strong></strong></span></p>
    <p>3</p>
  </div>
  <button><strong></strong></button>
</div>

```
```js
// 深度优先，用的是栈，同一边进出，后入先出
function deepFirstSearch(node) {
  var nodes = []
  if (node != null) {
    var stack = []
    stack.push(node) // 第一个元素无论 push 还是 unshift 都一样，这里只是为了相呼应。
    while(stack.length != 0) {
      // 最核心的差别在这里了
      // 第一次进来：是[$box]，弹出来后都是为空
      // 第二次进来: [button, div, ul]，然后 ul 被 pop 出去，收进结果数组 nodes 里
      var item = stack.pop()
      nodes.push(item)
      var children = item.children
      for (var i = children.length - 1; i >= 0; i--) {
        // 这一步也是一样，把每个子节点放进去待遍历数组
        // 把 $box 的子节点放进待选数组，此时是 [button, div, ul]
        // 第一次 while 进来都是一样
        // 这里先收集左边还是右边的子级意义都是一样的
        // 这里是从先把 button 放进来，ul 最后，等下 pop 出去就是 ul 最先
        stack.push(children[i])
        // 点出 ul 的子级，收进 stack 的最后，下次 while 进来，pop 就会是 ul 的子级，也即是 li
        // 然后再继续下去，还是会把 ul 的子级的子级，也就是 div，收进 stack 最后
        // 也就是不断的子级优先，达成深挖
      }
    }
  }
  return nodes
}

// 广度优先，用的是队列，一边进另一边出，先入先出
function breadthFirstSearch(node) {
  var nodes = []
  if (node != null) {
    var queue = []
    // 第一次进来：是[$box]，弹出来后都是为空
    // 第二次进来：[button, div, ul]，然后 button 被 unshift 出去，收进结果数组 nodes 里
    // 第三次进来：[div, ul, strong]，然后 div 被 unshift 出去，收进结果数组 nodes 里
    // 第四次进来：[ul, strong, p, p, p]，然后 ul 被 unshift 出去，收进结果数组 nodes 里
    // 可以看出跟深度的差别，点出子级都是排进待选数组的最后
    // 但是深度是栈pop，加塞在数组最后的子级优先
    // 广度是队列unshift，一起放进数组的兄弟级优先
    queue.unshift(node)
    while(queue.length != 0) {
      var item = queue.shift()
      nodes.push(item)
      var children = item.children
      for (var i = children.length - 1; i >= 0; i--) {
        queue.push(children[i])
        // 对应上面第二次进来：点出 button 的子级，也就是 strong，收进 queue 的最后
        // 但对 unshift 的结果没影响，下次 while 进来，unshift 依然是 div
        // 对应上面第三次进来：点出 div 的子级，也就是 p，收进 queue 的最后
      }
    }
  }
  return nodes
}
```

可以看出，就是在遍历时候暂存的数据结构不一样。
**深度优先**，就是一直深挖，孩子的孩子的孩子...。
**广度优先**，就是兄弟兄弟兄弟孩子兄弟...。需要注意的是，同级的就算兄弟。意思是相对于根级为孙子辈，就算不是同个父级，也算是兄弟级。

**2022-10-18 21:31:18**
更新了一篇用 js 做遍历的[《深广度优先遍历》](/2022/10/18/deepth-breadth-traversal/)。