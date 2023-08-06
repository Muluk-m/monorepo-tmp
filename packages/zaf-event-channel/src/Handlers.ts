import type { Func } from './types'
import { logger } from './shared/logger'

export class Handlers {
  private handlers: Record<string, Func[]> = {}

  private handlerIdMap = new Map<Func, string>()

  private ids: Record<string, number> = {}

  nextIdFor(name: string): number {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(this.ids[name])) {
      this.ids[name] = 0
    }
    return ++this.ids[name]
  }

  triggerHandlers(type: string, data: any): void {
    if (!type || !this.handlers[type]) {
      return
    }

    for (const handler of this.handlers[type] || []) {
      try {
        handler(data)
      } catch (e) {
        logger.error(`Error while triggering instrumentation handler.\nType: ${type} \nError:`, e)
      }
    }
  }

  instrument(name: string, handler: Func): string {
    const id = `${name}:${this.nextIdFor(name)}`

    this.handlerIdMap.set(handler, id)
    this.addInstrumentationHandler(name, handler)

    return id
  }

  private addInstrumentationHandler(type: string, callback: Func): void {
    this.handlers[type] = this.handlers[type] || []
    this.handlers[type].push(callback)
  }

  deleteInstrumentationHandler(type: string, callback: Func): void {
    if (this.handlers[type]) {
      const index = this.handlers[type].indexOf(callback)

      this.handlerIdMap.delete(callback)
      this.handlers[type].splice(index, 1)
    }
  }

  getHandlerLength(type: string): number {
    return this.handlers[type] ? this.handlers[type].length : 0
  }

  getHandlerId(handler: Func): string {
    return this.handlerIdMap.get(handler) || ''
  }

  has(name: string, handler: Func) {
    return this.handlers[name].includes(handler)
  }
}
