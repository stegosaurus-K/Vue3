import { hasChange, isObject } from '@vue/shared'
import { activeSub } from './effect'
import { Link, link, propagate } from './system'
import { reactive } from './reactive'

enum ReactiveFlags {
  IS_REF = '__v_isRef',
}

/**
 *
 */
class RefImpl {
  // 保存实际的值
  _value
  /**
   * 订阅者链表的头节点
   */
  subs: Link
  /**
   * 订阅者链表的尾节点
   */
  subsTail: Link;
  // ref标记，证明是一个ref
  [ReactiveFlags.IS_REF] = true
  constructor(value) {
    /**
     * 如果value是个对象，那么我们使用reactive给他包装成响应式对象
     */
    this._value = isObject(value) ? reactive(value) : value
  }

  get value() {
    if (activeSub) {
      // 如果activeSub有，那就保存起来，等我更新的时候触发
      trackRef(this)
    }
    return this._value
  }

  set value(newValue) {
    if (hasChange(newValue, this._value)) {
      // 触发更新
      this._value = isObject(newValue) ? reactive(newValue) : newValue
      // 通知effect重新执行，获取到最新的值
      triggerEffects(this)
    }
  }
}

export function ref(value) {
  return new RefImpl(value)
}

/**
 * 判断是不是一个ref
 * @param value
 * @returns
 */
export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}
/**
 * 收集依赖，建立ref和effect关联关系的链表
 * @param dep
 */
function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}
/**
 * 触发ref关联的effect重新执行
 * @param dep
 */
function triggerEffects(dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}
