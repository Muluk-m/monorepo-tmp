export interface Client {
  on: (name: string, handler: (...arg: any[]) => any) => void
  off: (name: string, handler: (...arg: any[]) => any) => void
  has: (name: string, handler: (...arg: any[]) => any) => boolean
  trigger: (name: string, data: any) => void
  request: <T = any>(options: string | Record<string, any>) => Promise<T>
  instance: (instanceGuid: string) => Promise<Client>
  metadata: () => Promise<Record<string, any>>
  context: () => Promise<Record<string, any>>
  invoke: (...arg: any[]) => Promise<any>
  get<P extends string>(path: P): Promise<{ [K in P]: any }>
  set: (...arg: any[]) => Promise<any>
}

export type ClientProxyType = keyof Client
