// 用来保存当前正在执行的effect
export let activeSub

class ReactiveEffect {
  constructor(public fn) {}

  run() {
    // 先将当前的effect保存起来，用来处理嵌套逻辑
    const prevSub = activeSub

    // 每次执行fn之前，把this放到activeSub上面
    activeSub = this
    try {
      return this.fn()
    } finally {
      // 执行完成后，把activeSub恢复成之前的effect
      activeSub = prevSub
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
 