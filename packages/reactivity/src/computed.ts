import { hasChange, isFunction } from '@vue/shared'
import { ReactiveFlags } from './ref'
import { Dependency, endTrack, link, Link, startTrack, Sub } from './system'
import { activeSub, setActiveSub } from './effect'

class ComputedRefImpl implements Dependency, Sub {
  // computed 也是一个ref
  [ReactiveFlags.IS_REF] = true
  // 保存fn的返回值
  _value

  // 作为dep，要关联subs，等我更新了，要通知他们重新执行
  /**
   * 订阅者链表的头节点
   */
  subs: Link
  /**
   * 订阅者链表的尾节点
   */
  subsTail: Link

  // 作为sub，我要知道哪些dep被我收集了
  // 订阅者链表的头节点
  deps: Link | undefined

  // 订阅者链表的尾节点
  depsTail: Link | undefined

  tracking = false

  //  计算属性脏不脏，如果为true, get value的时候执行update
  dirty = true
  constructor(
    public fn, // getter
    private setter,
  ) {}

  get value() {
    if (this.dirty) {
      // 如果计算属性是脏的，执行update
      this.update()
      
    }
    if (activeSub) {
      link(this, activeSub)
    }
    return this._value
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('我是只读的')
    }
  }

  update() {
    // 先将当前的effect保存起来，用来处理嵌套逻辑
    const prevSub = activeSub

    /**
     * 实现sub的功能， 为了在执行fn期间，收集fn执行过程中访问到的响应式数据
     * 并且建立dep和sub之间的关联关系
     */
    // 每次执行fn之前，把this放到activeSub上面
    setActiveSub(this)
    // depsTai标记为undefined， 表示被dep触发了重新执行，要尝试复用lin节点
    startTrack(this)
    try {
      const oldValue = this._value
      this._value = this.fn()
    
      // 如果值发生了变化，就返回true
      return hasChange(oldValue, this._value)
    } finally {
      endTrack(this)
      // 执行完成后，把activeSub恢复成之前的effect
      setActiveSub(prevSub)
    }
  }
}
/**
 * 计算属性
 * @param getterOrOptions  有可能是一个函数，也有可能是一个配置对象，有get set属性
 *
 */
export function computed(getterOrOptions) {
  let getter
  let setter
  if (isFunction(getterOrOptions)) {
    /**
     * const c = computed(() => {})
     */
    getter = getterOrOptions
  } else {
    /**
     * const c = computed({
     *    get(){},
     *    set(){}
     * })
     */
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
