import { hasChange, isObject } from '@vue/shared'
import { track, trigger } from './dep'
import { isRef } from './ref'
import { reactive } from './reactive'

export const mutableHandlers = {
  get(target, key, receiver) {
    /**
     * target = {a: 0}
     * 收集依赖，绑定target中某一个key和sub之间的关系
     */
    track(target, key)
    /**
     * 用来保证访问器里的this只想代理对象
     */
    const res = Reflect.get(target, key, receiver)
    if (isRef(res)) {
      //如果target.a是一个ref，那么热就直接把值给他，不用  .value
      /**
       * target = {a: ref(0)}
       */
      return res.value
    }

    if (isObject(res)) {
      return reactive(res)
    }
    return res
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key]
    /**
     * 触发更新，set的时候，通知之前的依赖重新执行
     */
    const res = Reflect.set(target, key, newValue, receiver)

    /**
     * 如果更新了state.a ,他是一个ref，那么会修改原始的 ref.value 的值等于 newValue
     * 如果 newValue 式一个ref，那就算了
     */
    if (isRef(oldValue) && !isRef(newValue)) {
      /**
       * const a = ref(0)
       * target = {a}
       * 更新target.a = 1, 就等于更新了 a.value,  a.value = 1
       */
      oldValue.value = newValue
      return res
    }
    if (hasChange(newValue, oldValue)) {
      /**
       * 如果新值和老值不一样，则触发更新
       */
      trigger(target, key)
    }

    return res
  },
}
