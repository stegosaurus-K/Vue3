import { isFunction, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isRef } from './ref'
import { isReactive } from './reactive'

export function watch(source, cb, options) {
  let { immediate, once, deep } = options || {}

  if (once) {
    // 如果once传了，那就保存一份，新的cb就直接调用原来的，加上停止监听
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      stop()
    }
  }

  let getter

  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    // 如果是一个reactive 那就把deep就改成true， 如果传了true，就以传了的为主
    getter = () => source
    if (!deep) {
      deep = true
    }
  } else if (isFunction(source)) {
    // 如果source是一个函数
    getter = source
  }

  if (deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }
  let oldValue
  function job() {
    const newValue = effect.run()
    cb(newValue, oldValue)
    oldValue = newValue
  }
  const effect = new ReactiveEffect(getter)

  effect.scheduler = job
  if (immediate) {
    job()
  } else {
    // 拿到oldValue，并且收集依赖
    oldValue = effect.run()
  }

  // 停止监听
  function stop() {
    effect.stop()
  }
  return stop
}

function traverse(value, depth = Infinity, seen = new Set()) {
  // 如果不是个对象，或者监听层级到了，直接返回value
  if (!isObject(value) || depth <= 0) {
    return value
  }
  // 如果之前访问过，直接返回，防止循环引用栈溢出
  if (seen.has(value)) {
    return value
  }
  depth--
  seen.add(value)

  for (const key in value) {
    // 递归触发getter
    traverse(value[key], depth, seen)
  }
  return value
}
