import { isObject } from '@vue/shared'

import { mutableHandlers } from './baseHandler'

export function reactive(target) {
  return createReactiveObject(target)
}


/**
 * 保存target和响应式对象之间的关联关系
 * target ==> proxy
 */
const reactiveMap = new WeakMap()

/**
 * 保存所有使用reactive创建出来的响应式对象
 */
const reactiveSet = new WeakSet()

function createReactiveObject(target) {
  /**
   * reactive必须接收一个对象
   */
  if (!isObject(target)) {
    return target
  }

  /**
   * 看一下这个target在不在reactiveSet中，如果在， 就证明target是响应式的，直接返回
   */
  if (reactiveSet.has(target)) {
    return target
  }

  /**
   * 获取到之前这个target创建的代理对象
   */
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    /**
     * 如果这个target之前使reactive创建过响应式对象，那就直接返回这个响应式对象
     */
    return existingProxy
  }

  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  reactiveSet.add(proxy)

  return proxy
}


/**
 *
 * @param target  判断target是不是响应式对象
 * @returns
 */
export function isReactive(target) {
  return reactiveSet.has(target)
}
