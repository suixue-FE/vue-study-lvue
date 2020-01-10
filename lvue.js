
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
  } else {
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
