import { endTrack, Link, startTrack, Sub } from './system'

// 用来保存当前正在执行的effect
export let activeSub

export function setActiveSub(sub) {
  activeSub = sub
}
class ReactiveEffect implements Sub {
  /**
   * 依赖项链表的头节点
   */
  deps: Link | undefined
  /**
   * 依赖项链表的尾节点
   */
  depsTail: Link | undefined
  tracking = false
  dirty = false
  constructor(public fn) {}

  run() {
    // 先将当前的effect保存起来，用来处理嵌套逻辑
    const prevSub = activeSub

    // 每次执行fn之前，把this放到activeSub上面
    setActiveSub(this)
    // depsTai标记为undefined， 表示被dep触发了重新执行，要尝试复用lin节点
    startTrack(this)
    try {
      return this.fn()
    } finally {
      endTrack(this)
      // 执行完成后，把activeSub恢复成之前的effect
      setActiveSub(prevSub)
    }
  }
  /**
   * 通知更新的方法，如果依赖的数据发生了变化，会调用这个函数
   */
  scheduler() {
    this.run()
  }
  /**
   * 默认调用run， 如果用户传了scheduler，则以用户传的为主，实力属性的优先级优于原型
   */
  notify() {
    this.scheduler()
  }
}

export function effect(fn, option) {
  const e = new ReactiveEffect(fn)
  // scheduler 调度器
  Object.assign(e, option)
  e.run()
  /**
   * 绑定函数的this
   */
  const runner = () => e.run()
  /**
   * 把effect的实例放到函数属性中
   */
  runner.effect = e
  return runner
}
