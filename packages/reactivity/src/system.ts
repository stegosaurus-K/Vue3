
export interface Link {
    sub: Function
    nextSub: Link
    prevSub: Link
}

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
 
export function propagate(subs) {
    let link = subs
    const queueEffects = []
    while (link) {
      queueEffects.push(link.sub)
      link = link.nextSub
    }
    queueEffects.forEach(effect => effect())
}