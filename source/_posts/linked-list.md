---
title: 链表
date: 2022-09-25 23:22:55
categories:
- 开发
- 算法
---

[链表](https://baike.baidu.com/item/%E9%93%BE%E8%A1%A8/9794473?fr=aladdin)的概念这里就不赘述了，直接上代码吧。
其他都没什么问题，主要是反转的做法。


```js
class Node {
  constructor(element) {
    this.element = element;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = new Node('head');
    this.length = 0;
  }
  insert(newElement, element = null) { // 加在某个元素后面，如果该元素不在，则加在 head 后面
    let currNode = this.find(element);
    if (!currNode) {
      currNode = this.head;
    }
    const newNode = new Node(newElement);
    newNode.next = currNode.next;
    currNode.next = newNode;
    this.length++;
    return this;
  }
  remove(element) {
    const prevNode = this.prev(element);
    if (prevNode && prevNode.next) {
      const currNode = prevNode.next;
      prevNode.next = currNode.next;
      this.length--;
    }
    return this;
  }
  find(element) {
    let node = this.head;
    while(node) {
      if (node.element === element) {
        break;
      }
      node = node.next;
    }
    return node;
  }
  getAll() {
    const result = [];
    let node = this.head;
    while(node && node.next) {
      node = node.next;
      result.push(node.element);
    }
    return result;
  }
  prev(element) {
    let node = this.head;
    while(node) {
      if (node.next && node.next.element === element) {
        break;
      }
      node = node.next;
    }
    return node;
  }
  next(element) {
    const currNode = this.find(element);
    if (currNode) {
      return currNode.next;
    }
    return null;
  }
  reverse(element) {
    // 直接倒序重新生成的不正规解法
    // let node = this.head;
    // this.getAll().reverse().forEach((element) => {
    // 	node.next = new Node(element);
    // 	node = node.next;
    // });
    // node.next = null;

    // 只需要循环一次的正规解法
    let head = this.prev(element); // 这个后面的元素要反转，所以也有可能是链表的 head
    let first = this.find(element); // 一直指向要反转的链表第一个
    if (!first) {
      head = this.head;
      first = this.head.next;
    }
    if (!first) return this;

    const node = first; // node 是不需要变的，一直都是一开始的第一个，因为每次循环 node 都会变位置，它的 next 指向也会一直变
    while(node && node.next) {
      const nextNode = node.next;
      node.next = nextNode.next;
      nextNode.next = first;
      first = nextNode;
    }
    head.next = first;
    // 每次都把 1 的 next 挪到 first 的前面，同时 1 也会相应的变位置
    // 12345：first = 1，node = 1，把 1 的 next 指向 3，2 的 next 指向 1，即把 2 放到 1（frist） 前面
    // 21345：first = 2，node = 1，把 1 的 next 指向 4，3 的 next 指向 2，即把 3 放到 2（frist） 前面
    // 32145：first = 3，node = 1，把 1 的 next 指向 5，4 的 next 指向 3，即把 4 放到 3（frist） 前面
    // 43215
    // 54321
    return this;
  }
}
```

下面是运行结果

<!--more-->


```js
const link = new LinkedList();

link.insert('2').insert('3', '2').insert('4', '3').insert('5', '4').insert('1', '10086');

// console.log(link.getAll(), link.length);

// console.log(link.find('3'));

// console.log(link.next('3'));

// console.log(link.prev('3'));

// console.log('-------------');

// link.remove('3');

// console.log(link.getAll(), link.length);

// console.log(link.find('3'));

// console.log(link.next('3'));

// console.log(link.prev('3'));

// console.log('-------------');

link.reverse('3');

console.log(link.getAll(), link.length);

// link.reverse();

// console.log(link.getAll(), link.length);
```