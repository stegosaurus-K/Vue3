import { activeSub } from './effect'
import { Link, link, propagate } from './system'

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
    this._value = value
  }

  get value() {
    if (activeSub) {
      // 如果activeSub有，那就保存起来，等我更新的时候触发
      trackRef(this)
    }
    return this._value
  }

  set value(newValue) {
    // 触发更新
    this._value = newValue
    // 通知effect重新执行，获取到最新的值
    triggerEffects(this)
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
