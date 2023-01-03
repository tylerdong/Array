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
和创建节点，删除节点相比，更新节点就较为复杂一点，但是只要理清逻辑就很好理解。  

更新节点就是当某些节点在新的vnode和旧的vnode中都有时，我们就需要细致比较一下，找出不一样的地方进行更新。  

我们先理解一下什么是静态节点？看下面的例子
```html
<p>我是不会变化的文字</p>
```
上面的这个节点只包含了纯文字，没有变量，不管数据如何变化，这个节点第一次就渲染了，就是以后永远不会省变化，因为它没有任何变量，所以数据发生变化与它无关，我们把这些节点叫做静态节点。  

更新节点需要对下面三种情况进行处理：  
1. 如果vnode和oldvnode均为静态节点
   静态节点无论数据发生任何变化都与它无关，所以都为静态节点的时候直接跳过，无需处理。
2. 如果vnode是文本节点
   如果vnode是文本节点，即表示这个节点内只包含纯文本，那么只需看oldnode是否也是文本节点，如果是，就比较两个文本是否不同，如果不同则把oldvnode里面的文本改成和vnode里的文本一样。如果oldvnode㐊文本节点，那么无论它是什么，直接调用setTextNode方法把它改成文本节点，并且文本内容和vnode相同。
3. 如果node是元素节点
   如果vnode是元素节点，则又细分为一下两种情况：

   -该节点包含子节点
   如果新的节点内包含子节点，那么此时要看旧的节点是否包含子节点，如果旧的节点里也包含子节点，那就需要递归对比新子节点；如果旧的节点里不包含子节点，那么这个旧节点有可能是空节点或者文本节点，如果旧的节点时空节点就把新的节点里的子节点创建一份然后插入到旧的节点里面，如果旧的节点时文本节点，则把新的节点里的子节点创建一份然后插入到旧的节点里面。
   
   -该节点不包含子节点
   如果该节点不包含子节点，同事它又不是文本节点，那就说明该节点时个空节点，不管旧节点里面之前是什么内容，直接情况就好。

我们看一下源码是怎么处理的。
```javascript
//更新节点
function patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly) {
  //vnode和oldVnode是否完全一样，若是，退出
  if(oldVnode === vnode) {
    return
  }
  const elm = vnode.elm = oldVnode.elm
  //vnode和oldVnode是否都是静态节点？若是，退出程序
  if (isTrue(vnode.isStatic) &&
   isTrue(oldVnode,isStatic) &&
   vnode.key === oldVnode.key &&
   (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))) {
    return
  }

  const oldCh = oldVnode.children
  const ch = vnode.children
  //若vnode没有text属性
  if (isUndef(vnode.text)) {
    //vnode的子节点和oldNode的子节点是否都存在？
    if (isDef(oldCh) && isDef(ch)) {
      //若都存在，判断子节点是否相同，不同则更新子节点
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
    }
    //若只有vnode的子节点存在
    else if (isDef(ch)) {
      /**
       * 判断oldVnode是否有文本？若没有，则把vnode的子节点添加到真实DOM中
       * 若有，则清空dom中的文本，再把vnode的子节点添加到真实dom中
       */
      if(isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    }
    //若只有oldnode的子节点存在
    else if (isDef(oldCh)) {
      //清空dom中的子节点
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    }
    //若node和oldnode都没有子节点，但是oldnode中有文本
    else if (isDef(oldVnode.text)) {
      //清空oldnode文本
      nodeOps.setTetContext(elm, '')
    }
    //总之一句话就是如果vnode中即没有text，也没有节点，那么对应的oldnode中有什么就清空什么
  }
  //若有，vnode的text属性于oldVnode的text属性是否相同？
  else if (oldVnode.text !== vnode.text) {
    //若不相同，则用vnode的text替换真实dom的文本
    node.Ops.setTextContext(elm, vnode.text)
  }
  

}
```
