# 1.前言
上一篇文章中介绍了VNode，VNode最大的用途就是数据变化前后生成虚拟DOM节点，对比新旧两份VNode，找出差异，更新有差异的DOM节点，最终达到减少操作真实DOM的目的。这一篇介绍如何找出差异，也就是DOM-DIFF算法。

# 2.patch
DOM-DIFF也可以成为patch，就是打打补丁。**打补丁的过程可以简单描述：以newVNode为基准，改造oldVNode使之和新的一样**。整个patch的过程可有三个操作，如下：

- newVNode中有，oldVNode中没有的VNode，在旧的中创建这个VNode
- oldVNode中有，newVNode中没有的VNode，在旧的中删除这个VNode
- newNode和oldVNode中都有的VNode，以newVnode为标准更新oldVnode

# 3.创建节点
在VNode对象描述的6中节点中，只有元素节点，文本节点，注释节点这3中可以被创建并插入到DOM中。要判断这三种节点类型要用到VNode对象的属性代码如下：

```javascript
function createElm(vnode, parentElm, refElm) {
  const data = vnode = vnode.data
  const children = vnode.children
  const tag = vnode.tag
  if(isDef(tag)) {
    vnode.elm = nodeOps.createElement(tag, vnode)  //创建元素节点
    createChildren(vnode, children, insertedVnodeQueue)  //创建元素节点的子节点
    insert(parentElm, vnode.elm, refElm)  //插入到DOM中
  } else if (isTrue(vnode.isComment)) {
    vnode.elm = nodeOps.createComment(vnode.text)   //创建注释节点
    insert(parentElm, vnode.elm, refElm)  //插入到DOM中
  } else {
    vnode.elm = nodeOps.createTexNode(vnode.text) //创建文本节点
    insert(parentElm, vnode.elm, refElm)  //插入到DOM中
  }
}
```

从上面的代码中可以看出：
- 根据VNode对象是否有tag标签判断是否是元素节点。如果有tag属性即认为是元素节点，然后调用createElement方法创建元素节点，通常它会有子节点，需要递归遍历创建所有子节点，然后insert到当前元素节点里面，最后将当前元素节点插入到DOM中。
- 根据VNode的isComment属性是否为true判断是否是注释节点，然后调用createComment方法创建注释节点，然后插入到DOM中。
- 如果既不是元素节点，也不是注释节点，就是文本节点，则调用createTextNode方法创建文本节点，然后插入到DOM中。

# 4.删除节点
oldVNode中有，newVNode中没有则需要从oldVNode中删除这个VNode。删除方法非常简单，只需要在删除节点的父元素上调用removeChild方法即可。源码如下：

```javascript
function removeNode(el) {
  const parent = nodeOps = nodeOps.parentNode(el)   //获取父节点
  if (isDef(parent)) {
    nodeOps.removeChild(parent, el)   //调用父节点的removeChild方法
  }
}
```

# 5.更新节点
