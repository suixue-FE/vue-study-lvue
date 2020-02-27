
// 对象的响应式
function defineReactive(obj,key,val){
  observe(val)
  const dep = new Dep()
  Object.defineProperty(obj,key,{
    get:function(){
      Dep.target&&dep.addDep(Dep.target)
      return val
    },
    set:function (newVal) {
      if (newVal !== val) {
        observe(newVal)
        val = newVal
        dep.notify() // 改变值时触发dep内部的循环更新
      }
    }
  })
}

// 数组的响应式
const arrayProtoBF = Array.prototype
// 备份一份，修改备份
const arrayProto = Object.create(arrayProtoBF);
['push','pop','shift','unshift'].forEach(method=>{
  arrayProto[method] = function(){
    // 执行数组原有方法应该执行的操作
    arrayProtoBF[method].apply(this,arguments)
    // 增加代理相关操作，通知更新
      console.log('数组执行'+ method)
  }
})

class LVue{
  constructor(options){
    this.$options = options
    this.$data = options.data
    proxy(this,'$data')

    // 创建observe观察者
    observe(this.$data)
    // 编译模板
    new Compile(options.el, this)
  }
}

function proxy(vm,str) {
  Object.keys(vm[str]).forEach(val=>{
    Object.defineProperty(vm,val,{
      get(){
        return vm[str][val]
      },
      set(newVal){
        vm[str][val] = newVal
      }
    })
  })
}

function observe(obj) {
  if (typeof obj !=='object' || obj ===null){
    return
  } 
  if(Array.isArray(obj)){
    // 替换原型
    obj._proto_ = arrayProto
    // 对数组内部元素执行响应化操作
    const keys = Object.keys(obj)
    for(let i in keys){
      observe(obj[i])
    }
  }else {
    new Observe(obj)
  }
}
class Observe {
  constructor(value){
    this.value = value
    this.walk(value)
  }

  walk(obj){
      Object.keys(obj).forEach(key => {
        defineReactive(obj, key, obj[key])
      })
  }
}

class Watcher {
  constructor(vm,key,updateFn){
    // vue实例
    this.vm = vm
    // 可触发/依赖 的key
    this.key = key
    // 更新函数
    this.updateFn = updateFn



    Dep.target = this
    this.vm[this.key];  // 这里新建watcher就执行一下该key的获取，在获取中会把watcher填入dep
    Dep.target = null
  }

  update(){
    this.updateFn.call(this.vm,this.vm[this.key])
  }
}

class Dep{
  constructor(){
    this.deps = []
  }
  addDep(dep){
    this.deps.push(dep)
  }
  notify(){
    // deps里面是一个一个的 watch ， 改变值后循环触发update方法
    this.deps.forEach(dep => dep.update());
  }
}
