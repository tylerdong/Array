# 1.前言

要想知道数据在什么时候被读取，被改写了，其实不难，JavaScript为我们提供了Object.defineProperty方法，通过该方法就可以轻松知道数据在什么时候发生了变化。

# 2.使用Object变得“可观测”
要将数据变得“可观测”，就要借助Object.defineProperty方法，在本文中，我们借助这个方法来使数据变得可观测。  

首先，我们定义一个数据对象car：

```javascript
let car = {
  'bind': 'BMW',
  'price': 3000
}
```

我们定义了这个car的品牌brand是BMW，价格price是3000，现在通过car.brand和car.price可以直接读取，修改对应的值。但是，当这个car的属性被读取和修改的时候，我们并不知情。那么，应该如何做到让car主动告诉我们，它的属性被读取或者修改了呢？  

下面，我们用Object.defineProperty()改写上面的列子：  

```javascript
let car = {}
let val = 3000
Ojbect.defineProperty(car, 'price', {
  enumerable: true,
  configurable: true,
  get() {
    console.log('price属性被读取了')
    return val
  },
  set(newVal) {
    console.log('price属性被修改了')
    val = newVal
  }
})
```

通过Object.defineProperty()方法给car定义了一个price属性，并把这个属性的读和写分别使用get()和set()进行了拦截，当属性被读写的时候就会触发get()和set()。  

为了把car所有的属性都变得可侦听，我们可以编写下面的代码：  
```javascript
  /**
   * Observer类会通过递归的方式把一个对象的所有属性都转化成可观测对象
   */
  export class Observer {
    constructor (value) {
      this.value = value
      // 给value新增一个__ob__属性，值为该value的Observer实例
      // 相当于为value打上标记，表示它已经被转化成响应式了，避免重复操作
      def(value,'__ob__',this)
      if (Array.isArray(value)) {
        // 当value为数组时的逻辑
        // ...
      } else {
        this.walk(value)
      }
    }

    walk (obj: Object) {
      const keys = Object.keys(obj)
      for (let i = 0; i < keys.length; i++) {
        defineReactive(obj, keys[i])
      }
    }
  }
  /**
   * 使一个对象转化成可观测对象
   * @param { Object } obj 对象
   * @param { String } key 对象的key
   * @param { Any } val 对象的某个key的值
   */
  function defineReactive (obj,key,val) {
    // 如果只传了obj和key，那么val = obj[key]
    if (arguments.length === 2) {
      val = obj[key]
    }
    if(typeof val === 'object'){
        new Observer(val)
    }
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get(){
        console.log(`${key}属性被读取了`);
        return val;
      },
      set(newVal){
        if(val === newVal){
            return
        }
        console.log(`${key}属性被修改了`);
        val = newVal;
      }
    })
  }
```
在上面的代码中，我们定义了observer类，它用来将一个正常的object转换成可观测的object。  

并且给value新增了一个__ob__属性，值为该value的Observer实例。这个操作相当于为value打上了标记，表示它已经被转化成响应式了，避免重复操作。  

然后判断数据的类型，只有object类型的数据才会调用walk将每一个属性转换成getter/setter的形式来侦听变化。在definReative中，当传入的属性也是一个object类型的时候，再次使用new observer(val)来递归子属性，这样我们就可以把obj中的所有属性（包含子属性）转换成getter/setter的形式来侦听。也就是说，只要我们将一个object传入到observer中，那么这个object就会变成可观测的，响应式的object。  

有了Observer类，我们就可以这样定义car：
```javascript
let car = new Objserver({
  brand: 'BMW',
  price: 3000
})
```
这样，car的两个属性就变得可侦听了。

# 3.依赖手机

## 3.1 什么是依赖收集
让object变的可侦听后，我们就知道数据什么时候发生了变化，当数据发生变化时，我们去通知视图。问题来了，视图这么多，要通知谁去变化呢？总不能一个数据变化了，把整个视图都更新一遍吧？此时我们想到，视图中谁用到这个数据就去更新谁，这样更加合理。  

换一个优雅的说法，我们把“谁用到这个数据”称为“谁依赖了这个数据”，我们给每个数据建立一个依赖数组（因为一个数据可能被多处使用），谁依赖这个数据我们就把它放在这个依赖数组中，那么当这个数据发生变化的时候，我们就去它对用的依赖数组中，把每个依赖都通知一遍，告诉他们：“你们依赖的数据已经发生改变，你们应该更新了”，这个过程就称为“依赖收集”。

## 3.2 何时收集依赖？何时更新依赖更新？
明白了什么是依赖收集之后，要在何时收集依赖？又该在何时通知依赖更新呢？  
在上面的3.1中，我们已经提到，谁用到这个数据，那再这个数据变化时就通知谁更新。其实就是谁获取了这个数据，而可侦听的数据被获取时会触发getter属性，name我们可以在getter中收集这个依赖。同样，当这个数据变化时会触发setter属性，name我们可以在setter中通知依赖更新。  
总之一句话就是：**在getter中收集依赖，在setter中通知更新**。

## 3.3 把依赖收集在哪里
在3.1小结中，我们给每个数据都建立一个依赖数组，谁依赖了这个数据我们就把谁放入到这个依赖数组中。单单用一个数组来存放依赖的话，好像有些欠缺，且代码过于耦合。我们应该将依赖数组的功能扩展一下，更好的做法是为每一个数据都建立一个依赖管理器，把这个数据所有的依赖都管理起来。这里，依赖管理器类应运而生。代码如下：
```javascript
export default class Dep {
  constructor() {
    this.subs = []
  }
  addSub(sub) {
    this.subs.push(sub)
  }
  //删除一个依赖
  removeSub(sub) {
    remove(this.subs, sub)
  }
  //添加一个依赖
  depend() {
    if (window.target) {
      this.addSub(window.target)
    }
  }
  //通知所有依赖更新
  notify() {
    const subs = this.subs.slice()
    for(let i = 0, l = subs.length; i < l; i++>) {
      subs[i].update()
    }
  }
}

export function remove(arr, item) {
  if(arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
```

在上面的依赖管理器Dep中，先初始化一个subs数组，用来存放依赖，并且定义了几个实例方法来对依赖进行添加，删除，通知等操作。  

有了依赖管理器后，我们可以在getter中收集依赖，在setter中通知依赖更新了，代码如下：
```javascript
function defineReactive(obj, key, val) {
  if (arguments.length == 2) {
    val = obj[key]
  }
  if (typeof val == 'object') {
    new Observer(val)
  }
  //实例化一个依赖管理器，生成一个依赖管理数组
  const dep = new Dep()
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      //在getter中收集依赖
      dep.depend()
      return val
    },
    set(newVal) {
      if (val === newVal) {
        return
      }
      val = newVal
      //在setter中通知依赖更新
      dep.notify()
    }
  })
}
```
在上述代码中，我们在getter中调用了dep.depend()方法收集依赖，在setter中调用dep.notify()方法通知所有依赖更新。

# 4.依赖到底是谁
明白了什么是依赖收集和何时收集依赖后，那么应该把依赖收集到哪里？收集的依赖到底是谁？  

虽然我们一直在说“谁用到了这个数据谁就是依赖”，代码层面是如何实现的呢？  

其实在vue中还实现了一个叫watcher的类，watcher类的实例就是我们上面所说的“谁”。换句话说就是：谁用到了数据，谁就是依赖，我们就为谁创建一个watcher实例。在之后数据变化时，我们布直接取通知依赖更新，而是通知依赖对应的watcher实例，由watcher实例去通知真正的视图。  

wathcer类的具体实现如下：
```javascript
export default class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm
    this.cb = cb
    this.getter = parsePath(expOrFn)
    this.value = this.get()
  }
  get() {
    window.target = this
    const vm = this.vm
    let value = this.getter.call(vm, vm)
    window.target = undefined
    return value
  }
  update() {
    const oldValue = this.value
    this.value = this.get()
    this.cb.call(this.vm, this.value, oldValue)
  }
}
/**
 * Parse simple path
 * 把一个形如data.a.b.c的字符串路径所表示的值，从真实的data对象中取出来
 * 例如：data = {a:b:{c:2}}
*/
const bailRE = /[^\w.$]/
export function parsePath(path) {
  if(bailRE.test(path)) {
    return
  }
  
  const segments = path.split('.')
  return function(obj) {
    for(let i = 0; i < segments.length; i++>) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}
```
谁用到了数据，谁就是依赖，我们就为谁创建一个watcher实例，在创建的过程中会自动的把自己添加到这个数据对应的依赖管理器中，以后这个watcher实例就代表这个依赖，当数据变化的时候我们就通知watcher实例，有watcher实例去通知真正的依赖。  

那么，在创建watcher实例的过程中它是如何把自己添加到这个数据对应的依赖管理器中呢？  

下面我们分析watcher类的代码实现逻辑：
1.当实例化watcher类时，会先执行其构造函数
2.在构造函数中调用了this.get()实例方法
3.在get()方法中，首先通过window.target = this把实例自身赋给了全局的一个唯一对象window.target上，然后通过let value = this.getter.call(vm, vm)获取一下被依赖的数据，获取被依赖数据的目的是触发该数据上面的getter，上文中说过，在getter中会调用dep.depend()收集依赖，而在dep.depend()中取到挂载window.target上并将其存入依赖数组，在get()方法最后将window.target释放。
4.而在数据变化时，会触发数据的setter，在setter中调用了dep.notify()方法，在dep.notify()方法中，遍历所有依赖（即watcher实例），执行依赖的update()方法，也就是Watcher类中的update()实例方法，在update()方法中调用数据变化的更新回调函数，从而更新视图。  

简单总结一下就是：watcher先把自己设置到全局唯一的指定位置（window.target）,然后读取数据。因为读取了数据，所以会触发这个数据的getter。接着，在getter中就会从全局唯一的那个位置读取当前正在读取数据的wathcer，并把这个watcher收集到Dep中去。收集好之后，当数据变化时，会向Dep中的每个watcher发送通知。通过这样的方式，watcher可以主动去订阅任意一个数据的变化。

# 5.不足之处
虽然我们通过Object.defineProperty方法实现了对object数据的可侦听，但是这个方法仅仅只能观测到object数据的取值和设置值，当我们向object数据里添加一对新的key/value或者删除一对已有的key/value时，它是无法观测到的，导致当我们对object数据添加或者删除时无法通知依赖，无法驱动响应式更新。  

Vue也注意到这一点，为了解决这个问题，Vue增加了两个全局API，Vue.set和Vue.delete，这两个API的实现原理后面介绍。

# 6.总结
首先，我们通过Object.defineProperty方法实现了对object数据的可侦听，并且封装了Observer类，让我们能够方便的把object数据中的所有属性（包含子属性）都转换成getter/setter的形式来侦测变化。  

接着，我们学习了什么菜蔬依赖收集，知道了再getter中收集依赖，在setter中通知依赖更新，以及封装了依赖管理器Dep，用于存储收集到的依赖。  

最后，我们为每一个依赖都创建了一个Watcher实例，当数据发生变化时，通知Watcher实例，由Watcher实例去做真实的更新操作。  

其整个流程大致如下:  

1. Data通过observer转换成getter/setter的形式来追踪变化。
2. 当外界通过watcher读取数据时，会触发getter从而将watcher添加到依赖中。
3. 当数据变化时，会触发setter，从而向Dep中的依赖（即watcher）发送通知。
4. watcher接收到通知后，会向外界发送通知，变化通知到外界后会触发视图更新，也有可能触发用户的某个回调函数等。

