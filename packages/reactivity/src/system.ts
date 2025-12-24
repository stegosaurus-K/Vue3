/**
 * 依赖项
 */
interface Dependency {
  //订阅者链表的头节点
  subs: Link | undefined
  // 订阅者链表的尾节点
  subsTail: Link | undefined
}
interface Sub {
  //订阅者链表的头节点
  deps: Link | undefined
  // 订阅者链表的尾节点
  depsTail: Link | undefined
}
/**
 * 链表节点
 */
export interface Link {
  // 订阅者
  sub: Sub
  nextSub: Link | undefined // 下一个节点
  prevSub: Link | undefined // 上一个节点

  // 依赖项
  dep: Dependency

  nextDep: Link | undefined
}

let linkPool: Link
/**
 * 建立链表关系
 * @param dep
 * @param sub
 */
export function link(dep, sub) {
  /**
   * 尝试复用链表节点
   * 1. 如果头节点有，尾节点没有，尝试复用头节点
   * 2. 如果尾节点还有nextDep，尝试复用尾节点的nextDep
   */
  const currentDep = sub.depsTail
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }
  let newLink
  /**
   * 看一下linkPool有没有，如果有，直接复用
   */
  if (linkPool) {
    newLink = linkPool
    linkPool = linkPool.nextDep
    newLink.nextDep = nextDep
    newLink.dep = dep
    newLink.sub = sub
  } else {
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: undefined,
      prevSub: undefined,
    }
  }

  /**
   * 将链表节点和dep建立关联关系
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.prevSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = newLink
    dep.subsTail = newLink
  }

  /**
   *
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = newLink
    sub.depsTail = newLink
  }
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs) {
  let link = subs
  const queueEffects = []
  while (link) {
    const sub = link.sub
    if (!sub.tracking) {
      queueEffects.push(sub)
    }
    link = link.nextSub
  }
  queueEffects.forEach(effect => effect.notify())
}
/**
 * 开始追踪依赖，将depsTail尾节点设置成undefined
 * @param sub
 */
export function startTrack(sub) {
  sub.tracking = true
  sub.depsTail = undefined
}
/**
 * 结束追踪，找到需要清理的依赖，断开关联关系
 * @param sub
 */
export function endTrack(sub) {
  sub.tracking = false
  const depsTail = sub.depsTail
  /**
   * depsTail 有，并且depsTail还有nextDep，应该把他们的依赖关系清理掉
   * depsTail 没有，并且头节点有， 那就把所有的依赖关系都清理掉
   *
   */
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    clearTracking(sub.deps)
    sub.deps = undefined
  }
}
/**
 * 清理依赖关系
 * @param link
 */
export function clearTracking(link: Link) {
  while (link) {
    const { nextDep, nextSub, prevSub, dep } = link
    /**
     * 如果prevSub有，那就把prevSub的下一个节点只想当前节点的下一个节点
     * 如果没有，那就是头节点，那就把dep.subs指向当前节点的下一个
     */
    if (prevSub) {
      prevSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }

    /**
     * 如果nextSub有，那就把nextSub的上一个节点只想当前节点的上一个节点
     * 如果nextSub没有，那就是尾节点，把depsTail指向当前节点的上一个节点
     */
    if (nextSub) {
      nextSub.prevSub = prevSub
      link.prevSub = undefined
    } else {
      dep.subsTail = prevSub
    }

    link.dep = link.sub = undefined

    link.nextDep = linkPool
    linkPool = link
    link = nextDep
  }
}
