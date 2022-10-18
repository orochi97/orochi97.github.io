---
title: 二叉树前序中序后序遍历
date: 2022-10-18 21:35:33
categories:
- 开发
- 算法
---

二叉树的遍历，详细概念还是看搜索引擎总结吧，[二叉树遍历](https://baike.baidu.com/item/%E4%BA%8C%E5%8F%89%E6%A0%91%E9%81%8D%E5%8E%86/9796049)

二叉树，前序、中序、后序，遍历，都是深度优先遍历
前中后指的是根节点的访问顺序
对最底层的节点而言，前中后就是三个节点
对于非最底层的节点而言，左右两个节点就是分支，不仅仅是三个节点

```js
const tree = {
  value: 1,
  left: {
    value: 2,
    left: {
      value: 4,
      left: {
        value: 8,
      },
      right: {
        value: 9,
      },
    },
    right: {
      value: 5,
      left: {
        value: 10,
      },
      right: {
        value: 11,
      },
    },
  },
  right: {
    value: 3,
    left: {
      value: 6,
      left: {
        value: 12,
      },
      right: {
        value: 13,
      },
    },
    right: {
      value: 7,
      left: {
        value: 14,
      },
      right: {
        value: 15,
      },
    },
  },
};
```

<!-- more -->

```js

// 前序遍历
// 前序遍历：首先访问根结点，然后遍历左子树，最后遍历右子树（根->左->右）
// 顺序：访问根节点->前序遍历左子树->前序遍历右子树

// 递归解法
function preorderTraversal1(tree) {
  const arr = [];
  function recursion(node) {
    if (!node) return;
    arr.push(node.value);
    recursion(node.left);
    recursion(node.right);
  }
  recursion(tree);
  return arr;
}
// 栈迭代解法
function preorderTraversal2(tree) {
  const arr = [];
  const stack = [tree];
  while(stack.length) {
    const node = stack.pop();
    if (node) {
      arr.push(node.value);
      // 注意这里由于先进后出，所以右节点先进入
      stack.push(node.right);
      // 注意这里由于先进后出，看起来是根右左，其实是根左右
      stack.push(node.left);
    }
  }
  return arr;
}

// 中序遍历
// 中序遍历：首先遍历左子树，然后访问根节点，最后遍历右子树（左->根->右）
// 顺序：中序遍历左子树->访问根节点->中序遍历右子树

// 递归解法
function inorderTraversal1(tree) {
  const arr = [];
  function recursion(node) {
    if (!node) return;
    recursion(node.left);
    arr.push(node.value);
    recursion(node.right);
  }
  recursion(tree);
  return arr;
}
// 栈迭代解法
function inorderTraversal2(node) {
  const arr = [];
  const stack = [];
  while(stack.length || node) {
    // 第一次大循环进来 node 是 1
    // 第二次大循环进来 node 是 undefined
    // 第三次大循环进来 node 是 9
    // 第四次大循环进来 node 是undefined
    while(node) {
      // 第一次小循环后，[1,2,4,8]
      // 第二次没有小循环
      // 第三次小循环后，[1,2,9]
      // 第四次没有小循环
      stack.push(node);
      node = node.left;
    }
    // 第一次大循环访问 8 这个节点
    // 第二次大循环访问 4 这个节点，注意这里的 4 是根节点，接下来要访问它的右分支
    // 第三次大循环访问 9 这个节点
    // 第四次大循环访问 2 这个节点，注意这里的 2 是根节点，接下来要访问它的右分支
    node = stack.pop();
    arr.push(node.value);
    // 第一次大循环的 8 没有子节点，node 为 undefined
    // 第二次大循环的 4 right 节点是 
    /* right: {
      value: 9,
    } */
    // 第三次大循环的 9 没有子节点，node 为 undefined
    // 第四次大循环的 2 right 节点是
    /* {
      value: 5,
      left: {
        value: 10,
      },
      right: {
        value: 11,
      },
    } */
    // 然后每个小节点就又如上述描述的过程，根据“左根右”顺序遍历
    node = node.right;
  }
  return arr;
}

// 后序遍历
// 后序遍历：首先遍历左子树，然后遍历右子树，最后访问根节点（左->右->根）
// 顺序：后序遍历左子树->后序遍历右子树->访问根节点

// 递归解法
function postorderTraversal1(tree) {
  const arr = [];
  function recursion(node) {
    if (!node) return;
    recursion(node.left);
    recursion(node.right);
    arr.push(node.value);
  }
  recursion(tree);
  return arr;
}
// 栈迭代解法
function postorderTraversal2(node) {
  const arr = [];
  const stack = [node];

  // // 可以采用前序遍历的方法，最后整个数组反转
  // while(stack.length) {
  //   node = stack.pop();
  //   if (node) {
  //     arr.push(node.value);
  //     // 注意这里由于先进后出，看起来是根左右，但其实是根右左
  //     // 在下面 reverse 之后，就是左右根，变成后序了
  //     stack.push(node.left);
  //     stack.push(node.right);
  //   }
  // }
  // return arr.reverse();

  // 可以采用前序遍历的方法，先进的放在最后，变成后序遍历了
  while(stack.length) {
    node = stack.pop();
    if (node) {
      arr.unshift(node.value);
      stack.push(node.left);
      stack.push(node.right);
    }
  }
  return arr;
}

console.log('前序遍历-递归: ', preorderTraversal1(tree));

console.log('前序遍历-迭代:', preorderTraversal2(tree));

console.log('中序遍历-递归: ', inorderTraversal1(tree));

console.log('中序遍历-迭代: ', inorderTraversal2(tree));

console.log('后序遍历-递归: ', postorderTraversal1(tree));

console.log('后序遍历-迭代: ', postorderTraversal2(tree));
```