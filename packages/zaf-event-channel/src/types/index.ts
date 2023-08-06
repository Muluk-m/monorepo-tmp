export * from './Client'

export type Func = (...arg: any[]) => any

export type PendingPromise = { resolve: Func; reject: Func }
