// 用来保存当前正在执行的effect
export let activeSub


export function effect(fn) {
    activeSub = fn
    activeSub()
    activeSub = undefined

}