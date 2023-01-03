# 1.前言

虚拟dom在前端三大框架中都有设计，下面我们看看vue中的虚拟dom是如何实现的。

# 2.虚拟DOM简介

## 1.什么是虚拟DOM

所谓虚拟DOM，就是用JS对象来描述一个DOM节点，如下所示：
```html
<div class="a" id="b">我是内容</div>
```

```javascript
{
  tag: 'div',          //元素属性
  attrs: {             //属性
    class: 'a',
    id: 'b'
  },
  text: '我是内容',     //文本内容
  children: []          //子元素
}
```

我么把组成一个DOM节点必要的东西通过一个JS对象表示出来，那么这个JS对象就可以用来描述这个DOM节点，我们把这个JS对象就乘坐是这个真实DOM节点的虚拟DOM节点。

## 2.为什么要有虚拟DOM？
浏览器标准将DOM设计的非常复杂，直接操作真实的DOM非常消耗性能，Vue使用JS计算性能来换取操作DOM的性能。  

Vue是数据驱动试图，数据发生变化试图就要随之更新，更新试图的时候就不可避免要操作DOM。我们尽量减少DOM操作，思路是通过对比数据变化前后的状态，计算出视图中哪些地方需要更新，这样只更新变化的部分。

对比变化前后虚拟DOM节点，通过DIFF算法计算出需要更新的地方，然后去更新需要更新的试图。这就是虚拟DOM产生的原因和用途。

# 3.Vue中的虚拟DOM
下面我们从源码出发，深入学习虚拟DOM和DIFF算法。

## 3.1 VNode类
上面我们说到，使用JS对象来描述一个真实的DOM节点，而在Vue中就有一个VNode类，通过这个类，我们可以实例化出不同的虚拟DOM节点，源码如下：
```javascript
export default class VNode {
  constructor {
    tag?: string,
    data?:VnodeData,
    children?: ?Array<Vnode>,
    text?: string,
    elm?: Node,
    context?: Component,
    commonentOptions?: VnodeComponentOptions,
    asyncFactory?: Function
  } {
    this.tag = tag        //当前节点的标签名
    this.data = data      //当前节点对应的对象，包含了一些具体的数据信息，是一个VNodeData类型，可以参考VNodeData数据信息
    this.children = children  //当前节点的子节点，是一个数组
    this.text = text //当前节点的文本
    this.elm = elm  //当前虚拟节点对应的真实dom节点
    this.ns = undefined   //当前节点的名字空间
    this.context = context //当前组件节点对应的Vue实例
    this.fnContext = undefined  //函数式组件对应的vue实例
    this.fnOptions = undefined
    this.fnScopeId = undefined
    this.key = data && data.key   //节点的key属性，被当做节点的标志，用于优化
    this.componentOptions = componentsOptions   //组件的option选项
    this.componentInstance = undefined  //当前节点对应的组件的实例
    this.parent = undefined   //当前节点的父节点
    this.raw = false  //是否是原生的HTML或者是只普通文本，innerHTML的时候为true，textContent的时候为false
    this.isStatic = false   //静态节点标志
    this.isRootInsert = true    //是否作为跟节点插入
    this.isComment = false    //是否为注释节点
    this.isCloned = false   //是否为克隆节点
    this.isOnce = false   //是否有v-once指令
    this.asyncFactory = asyncFactory
    this.asyncMeta = undefined
    this.isAsyncPlaceholder = false
  }

  get child(): Component | void {
    return this.componentInstnce
  }
}
```

从上面代码中可以看出，VNode类中包含了描述一个真实DOM节点所需的一系列属性，例如tag表示节点的标签名，text表示节点中包含的文本，children表示节点包含的子节点等。通过属性搭配，可以描述出各种类型的真实DOM节点。

## 3.2 Vnode的类型
通过不同的属性搭配，可以描述出以下类型的节点：
- 注释节点
- 文本节点
- 元素节点
- 组件节点
- 函数式组件节点
- 克隆节点

接下来，从源码的角度看看他们是如何被描述的。

#### 3.2.1 注释节点

注释节点描述起来就非常简单了，它只需要两个属性就够了，源码如下：
```javascript
//创建注释节点
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}
```

从上面的代码中可以看到，描述一个注释节点只需要两个属性，分别是`text`和`isComment`。其中`text`属性表示具体的注释信息，`isComment`是一个标志，用来标识一个节点是否是注释节点。

### 3.2.2 文本节点

文本节点描述起来比注释节点更加简单，只需要一个`text`属性，用来标识具体的文本信息。源码如下：

```javascript
//创建文本节点
export function createTextVNode(val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}
```

### 3.2.3 克隆节点
克隆节点就是把一个已存在的节点复制一份出来，主要是为了做模板编译优化时使用，如下：
```javascript
export function cloneVNode(vnode: VNode) : VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  )
  cloned.ns = vnode.ns
  cloned.static = vnode.static
  cloned.key = vnode.key
  cloned.isComment = vnode.isComment
  cloned.fnContext = vnode.fnContext
  cloned.fnOptions = vnode.fnOptions
  cloned.fnScopeId = vnode.fnScopeId
  cloned.asyncMeta = vnode.asyncMeta
  cloned.isCloned = true
  return cloned
}
```

从上面的代码中可以看出，克隆节点就是把已有的属性节点全部复制到新节点中，而现有节点和克隆得到的新节点区别是，克隆得到的节点的`isCloned`为 `true`

### 3.2.4 元素节点
相比之下，元素节点更接近于我们通常看到的真实`dom`节点，它使用`tag`来描述节点标签名称，使用data属性中的`class`，`attributes`等来描述节点属性，使用`children`来描述子节点信息。由于元素节点包含的情况比较复杂，源码中没有像上面三种节点一样直接写死，当然也不可能写死，这里就举一个简单的例子说明一下：

```javascript
//真实DOM节点
<div id="a"><span>热血未冷</span></div>

//VNode节点
{
  tag: 'div',
  data: {},
  children: [
    {
      tag: 'span',
      text: '热血未冷'
    }
  ]
}
```

真实dom节点中`div`标签中包含了一个`span`标签，而且`span`标签里有一段文本。VNode对象上`tag`属性表示标签名，`data`表示标签的属性，如`id`等，`children`表示子节点数组。

### 3.2.5 组件节点
组件节点除了有元素节点的属性之外还有两个特有的属性：
- componentOptions：组件的option选项，例如`props`等
- conponentInstance：当前组件对用的`vue`实例

### 3.2.6 函数式节点
函数式节点相较于组件节点，它又有两个特有的属性：
- fnContext：函数式组件对应的Vue实例
- fnOptions：组件的option选项

### 3.2.7 小结
以上就是`VNode`可以描述的6种类型的节点，他们本质上都是'VNode'类的实例，只是在实例化的时候传入的属性参数不同而已。

## 3.3 VNode的作用
`VNode`在`Vue`虚拟`DOM`过程中起来什么作用呢？
在试图渲染之前，把写好的`template`模板先编译成`VNode`并缓存下来，等到数据发生变化，页面需要重新渲染的时候，我们把数据发生变化后生成的`VNode`与前一次缓存下来的`VNode`进行对比，找出差异，然后有差异的`VNode`对应的真实`DOM`节点就是需要重新渲染的节点，根据有差异的`VNode`创建出真实的`DOM`节点插入到试图中，最终完成一次试图更新。


# 4.总结
为什么要有虚拟`DOM`，总结出来就是因为JS的计算性能高于操作`DOM`。本文从源码角度解析`Vue`中通过`VNode`实例化出不同类型的虚拟`DOM`节点，属性不同，类型也不同。所谓不同类型的节点其本质还是一样的，都是`VNode`类型的实例，只是在实例化的时候传入的属性参数不同罢了。  

最后探究了`VNode`的作用，就是方便DIFF算法找出差异，更新试图，从而达到尽可能减少操作真实`DOM`的目的，以提高性能。