export interface Link {
  // 保存 effect
  sub: Function
  nextSub: Link | undefined // 下一个节点
  prevSub: Link | undefined // 上一个节点
}

/**
 * 建立链表关系
 * @param dep 
 * @param sub 
 */
export function link(dep, sub) {
  const newSub = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
  }
  if (dep.subsTail) {
    dep.subsTail.nextSub = newSub
    newSub.prevSub = dep.subsTail
    dep.subsTail = newSub
  } else {
    dep.subs = newSub
    dep.subsTail = newSub
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
    queueEffects.push(link.sub)
    link = link.nextSub
  }
  queueEffects.forEach(effect => effect.notify())
}
