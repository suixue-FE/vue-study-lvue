class Compile {
  constructor(el, vm){
    this.$el = document.querySelector(el)
    this.$vm = vm

    if (this.$el){
      this.compile(this.$el)
    }
  }

  // 编译,vue的语法
   compile(el){
    const childNodes = el.childNodes
    Array.from(childNodes).forEach(node=>{
      if (this.isElement(node)){
        // console.log("编译元素" + node.nodeName)
        this.compileElement(node)
      } else if(this.isInterpolation(node)){
        // console.log("编译差值文本" + node.textContent)
        this.compileText(node)
      }
      if (node.childNodes&&node.childNodes.length>0) {
        this.compile(node)
      }
    })
  }
  isElement(node){
    return node.nodeType === 1
  }
  isInterpolation(node){
    return node.nodeType === 3 &&/\{\{(.*)\}\}/.test(node.textContent)
  }

  // node为元素时编译方法
  compileElement(node){
    let nodeAttrs = node.attributes
    Array.from(nodeAttrs).forEach(attr=>{
      let attrName = attr.name
      let exp = attr.value
      console.log(exp)
      // 属性名以 l- 开头时处理
      if (attrName.indexOf("l-")===0){
        let dir = attrName.substring(2)
        // 拿出后面的html、text 等，html、text会被在内部定义方法
        this[dir]&&this[dir](node,exp)
      }
      // 时间处理
      if(this.isEvent(attrName)){
        // @click = onClick
        const dir = attrName.substring(1) // click
        
        // 事件监听
        this.eventHandler(node,exp,dir)
      }
    })
  }
  isEvent(dir){
    return dir.indexOf('@') == 0
  }
  eventHandler(node,exp,dir){
    const fn = this.$vm.$options.methods &&
    this.$vm.$options.methods[exp]
    node.addEventListener(dir,fn.bind(this.$vm))
  }
  // node为文本时处理
  compileText(node){
    this.update(node,RegExp.$1,'text')
  }

  // 初始化时执行 更新方法，并传入text
  text(node,exp){
    this.update(node,exp,'text')
  }

  //  初始化时执行 更新方法 目的是 update中创建了Watcher，可以传入改变方法，在数据监听时就可执行了
  html(node,exp){
    this.update(node,exp,'html')
  }

  model(node,exp){
    // update方法只完成赋值和更新
      this.update(node,exp,'model')
    // 所以还需要事件监听
      node.addEventListener('input',e=>{
        // 将新的值赋值给数据即可
        this.$vm[exp]=e.target.value
      })
  }

  // 创建更新函数，和watcher绑定
  update(node,exp,dir){
    const fn = this[dir+'Updater']
    fn && fn(node,this.$vm[exp])
    new Watcher(this.$vm,exp,function (val) {
      fn && fn(node,val)
    })
  }

  // v-text 绑定text方法
  textUpdater(node,val){
    node.textContent = val
  }

  // v-html 绑定html方法
  htmlUpdater(node,val){
    node.innerHTML = val
  }

  modelUpdater(node,val){
    // 多用在表单元素，暂时只考虑表单元素赋值
    node.value = val
  }
}
