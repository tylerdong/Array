# 1. 前言
上一篇文章中我们介绍了object数据的变化侦听方式，这里我们来看一下Array类型数据的变化Vue是如何进行侦听的。  

为什么object数据和Array类型的数据会有两种不同的变化侦听方式？  

这是因为对于object数据我们使用的是js提供的对象原型上的方法object.defineProperty，这个方法是对象原型上的，所以Array无法使用这个方法，所以我们需要对Array类型的数据设计一套另外的变化侦听机制。  

虽然是另外一套新的侦听机制，但是基本思路是不变的，还是在获取数据的时候收集依赖，数据变化的时候通知依赖更新。  

下面我们通过原来来看看Vue对Array类型的数据到底是如何侦听变化的。

# 2.在哪里收集依赖
我们还是要先把用到Array型数据的地方作为依赖收集起来，那么第一个问题就是该在哪里收集呢？  

其实Array类型的数据的依赖收集方式和object数据的依赖收集方式相同，都是在getter中收集。那么问题来了，不是说Array是无法通过Object.defineProperty方法来侦听的吗？无法使用是如何在getter中收集依赖的呢？  

其实不然，我们在使用vue开发的时候，组件的data选中是这样写的：
```javascript
data() {
  return {
    arr: [1, 2, 3]
  }
}
```
想想看，arr这个数据始终存放在一个object数据对象中，而且我们说了，谁用到这个数据谁就是依赖，name要用到arr这个数据，是不是得先从data这个对象找那个获取这个arr数据，而从data中获取这个arr自然会触发arr的getter，所以就可以在getter中收集依赖。

# 3. 使Array型数据可侦听
通过上一章我们知道Array数据还是在getter中收集依赖，换句话说，我们已经知道了Array数据何时被读取了。  

在上一篇文章中介绍了Object数据变化侦听的时候，我们先让Object数据变的可侦听，即我们能够知道数据什么时候被读取了，什么时候发生变化。同理，对于Array型数据我们何时被读取了，而何时发生变化我们无法知道，那么接下来就解决这个问题：当Array类型数据发生变化时我们如何得知？

## 3.1 思路分析
Object的变化通过setter来追踪，只有某个数据发生了变化，就一定会触发这个数据上的setter。但是Array型数据没有setter，怎么办？  

我们试想一下，要想让Array型数据发生变化，必然是操作了Array，而JS中提供的操作数组的方法就那么集中，我们可以把这些方法都重写一遍，在不改变原有功能的前提下，我们为其增加一些其他功能，例如下面这个例子：  
```javascript
let arr = [1, 2, 3]
arr.push(4)
Array.property.newPush = function(val) {
  console.log('arr被修改了')
  this.push(val)
}
arr.newPush(4)
```

在上面这个例子中，我们针对数组的原生push方法定义了一个新的newPush方法，这个newPush方法内部调用了原生的push方法，这样就保证了新的newPush方法跟原生push方法具有相同的功能，而且我们还可以在新的newPush方法内部做一些别的事情，例如通知变化。

## 3.2 数组方法拦截
基于上一小结的思想，在vue中创建了一个数组方法拦截器，它拦截在数组实例和Array.property之间，在拦截器内重写了操作数组的一些方法，当数组实例使用操作数组方法时，其实使用的是拦截器中重写的方法，而不是使用Array.property上的原生方法。  

在Array原型中可以改变数组自身内容的方法有7个，分别是push，pop，shift，unshift，splice，sort，reverse。源代码中的拦截器代码如下：
```javascript
const arrayProto = Array.prototype

//创建一个对象作为拦截器
export const arrayMethods = Object.create(arrayProto)

//改变数组自身内容的7个方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

methodsToPatch.forEach(function(method) {
  //缓存原生方法
  const original = arrayaProto[method]
  //重写原生方法
  Object.defineProperty(arrayMethods, method, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function mutator(...args) {
      const result = original.apply(this, args)
      return result
    }
  })
})
```

在上面代码中，首先创建了继承自Array原型的空对象，arrayMethods，接着在arrayMethods上使用object.defineProperty方法将哪些可以改变数组自身的7个方法遍历进封装。最后，当我们使用push方法的时候，其实用的是arrayMethods.push，而arrayMethods.push就是封装的新函数mutator，也就是说，实际上执行的是函数mutator，而mutator函数内部执行了original函数，这个original函数就是Array.property上对应的原生方法。那么我们就可以在mutator函数中做一些其他的事，比如变化通知。

## 3.3 使用拦截器
把拦截器做好还不够，还要把它挂载到数字实例和Array.property之间，这样拦截器才能够生效。  

挂载其实不难，只需要把数据的_proto_属性设置为拦截器arrayMethods即可，源代码如下：  
```javascript
export class Observer {
  constructor(value) {
    this.value = value
    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
    }
  }
}

//能力监测，判断_proto_是否可用，因为有的浏览器不支持这个属性
export const hasProto = '_proto_' in {}

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

function protoAugment(target, src: Object, keys: any) {
  target._proto_ = src
}

function copyAugment(target: Object, src: Object, keys: Array<string>) {
  for(let i = 0, l = keys.length; i < 1; i++>) {
    const key = keys[i]
    def(target, key, src[key])
  }
}
```

上面代码中首先判断浏览器是否支持_proto_，如果支持，则调用protoAugment函数把value._proto_ = arrayMethods；如果不支持，则调用copyAugment函数把拦截器中重写的7个方法循环加入到value上。  

拦截器生效后，当数据再发生变化时，我们就可以在拦截器中通知变化了，也就是说现在我们就可以知道数组数据何时变化了，ok，上面我们完成了对array类型数据的可侦听。

# 4.再谈依赖收集

## 4.1 把依赖收集到哪里
在第二章我们说了，数组数据的依赖也在getter中收集，而给数组数据添加getter/setter都是在observer类中完成的，所以我们也应该在observer类中收集依赖，源码如下：
```javascript
export class Observer {
  constructor(value) {
    this.value = value
    //实例化一个依赖管理器，用来收集数组依赖
    this.dep = new Dep()
    if (Array.isArray(value)) {
      const augment = hasProto ? protoAugment : copyAugment
      augment(value,arrayMethods, arrayKeys)
    } else {
      this.walk(value)
    }
  }
}
```
在上面代码中，在Observer类中实例化了一个依赖管理器，用来收集数组依赖。

## 4.2 如何收集依赖
在第二章中我们说了，数组的依赖也在getter中收集，那么在getter中到底如何收集呢？这里有一个需要注意的点，那就是依赖管理定义在observer类中，而我们需要在getter中收集依赖，也就是说我们必须在getter中能够访问到Observer类中的依赖管理，才能把依赖存进去。源码如下：
```javascript
```


