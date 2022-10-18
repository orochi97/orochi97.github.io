---
title: 深广度优先遍历
date: 2022-10-18 21:18:08
categories:
- 开发
- 算法
---

之前其实有写过一篇类似的文章[《深度优先遍历(DFS)-栈和广度优先遍历(BFS)-队列的理解》](/2020/11/15/search/)。
再次复习一下，写了不一样的注释。而且之前是用 dom 做的遍历，这次还是回到数据来。

```js
// 深广度优先遍历

const tree = {
  value: 1,
  children: [
    {
      value: 2,
      children: [
        {
          value: 4,
          children: [
            {
              value: 8
            },
            {
              value: 9
            },
          ],
        },
        {
          value: 5,
          children: [
            {
              value: 10
            },
            {
              value: 11
            },
          ],
        },
      ],
    },
    {
      value: 3,
      children: [
        {
          value: 6,
          children: [
            {
              value: 12
            },
            {
              value: 13
            },
          ],
        },
        {
          value: 7,
          children: [
            {
              value: 14
            },
            {
              value: 15
            },
          ],
        },
      ],
    }
  ],
};
```

<!-- more -->

```js

// 深度优先，递归解法
// 最好理解的做法，检测到一个节点有 children，就递归遍历
// 一直挖到没有，就返回上一个节点的兄弟节点继续遍历
function deepthTraversal1(tree) {
  const arr = [];
  function recursion(node) {
    if (!node) return;
    arr.push(node.value);
    if (node.children) {
      node.children.forEach(child => {
        recursion(child);
      });
    }
  }
  recursion(tree);
  return arr;
}

// 深度优先，栈解法
// 每一轮遍历先把当前节点的值访问了，再遍历其子节点
// 利用队列先进后出特性，右边进去右边出，
// 一开始是[1]，这轮循环把 1 的 children 都遍历了，循环这次后是[3,2]
// !!!注意这里遍历是倒序的，所以会是先3后2，正序也可以，只是这样的深度顺序就不一样，倒序遍历的结果好理解
// 第二次是[3,2]，这轮循环把 2 的 children 都遍历了，循环这次后是[3,5,4]
// 第三次是[3,5,4]，这轮循环把 4 的 children 都遍历了，循环这次后是[3,5,9,8]
// 以此类推，按层级来看，就是把相同层级 L 的节点在同次循环中加入
// 然后它们的子层级也就是相同的 L+1 节点，会在遍历 L 节点 children 时候加入
// 这样由于先进后出，每个节点的子节点后加入栈，反而会先被访问到
// 变成访问 L 节点，下次访问它的子节点 L+1，下次是它的孙节点，L+1+1，这样达到深度优先效果
function deepthTraversal2(tree) {
  const arr = [];
  const stack = [tree];
  while(stack.length) {
    const node = stack.pop();
    arr.push(node.value);
    const children = node.children;
    if (children && children.length) {
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push(children[i]);
      }
    }
  }
  return arr;
}

// 广度优先，队列解法
// 每一轮遍历先把当前节点的值访问了，再遍历其子节点
// 利用队列先进先出特性，右边进去左边出，
// 一开始是[1]，这轮循环把 1 的 children 都遍历了，循环这次后是[2,3]
// 第二次是[2,3]，这轮循环把 2 的 children 都遍历了，循环这次后是[3,4,5]
// 第三次是[3,4,5]，这轮循环把 3 的 children 都遍历了，循环这次后是[4,5,6,7]
// 以此类推，按层级来看，就是把相同层级 L 的节点在同次循环中加入
// 然后它们的子层级也就是相同的 L+1 节点，会在遍历 L 节点 children 时候加入
// 所以保证了每个相同层级的节点都在一起，且按照上到下的顺序遍历，这样达到广度优先效果
function breadthTraversal(tree) {
  const arr = [];
  const queue = [tree];
  while(queue.length) {
    const node = queue.shift();
    arr.push(node.value);
    if (node.children && node.children.length) {
      node.children.forEach((child) => {
        queue.push(child);
      });
    }
  }
  return arr;
}

console.log('深度优先-递归: ', deepthTraversal1(tree));

console.log('深度优先-迭代: ', deepthTraversal2(tree));

console.log('广度优先: ', breadthTraversal(tree));
```