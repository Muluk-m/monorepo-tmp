import type { ClientProxyType, PendingPromise, Client } from './types'
import { makeLogger, isValidEventByParent, finalizePendingPromise, removePromise } from './shared'
import { Handlers } from './Handlers'

const logger = makeLogger({
  prefix: 'ClientProxy',
})

interface ClientProxyOptions {
  appGuid?: string
  debug?: boolean
}

export class ZAFClientProxy implements Client {
  constructor(private options: ClientProxyOptions = {}) {
    const isIframe = window.self !== window.top

    if (!isIframe) {
      throw new Error('ClientProxy can only be used in an iframe.')
    }

    this.parentWindow = window.parent

    this.receiveReplyMessage()
  }

  private parentWindow: Window | null

  private handlers = new Handlers()

  private pendingPromises: Record<string, PendingPromise> = {}

  private receiveReplyMessage() {
    window.addEventListener('message', (event) => {
      if (!isValidEventByParent(event, this.parentWindow!)) {
        return
      }

      let { data } = event

      if (!data) {
        return
      }

      if (typeof data === 'string') {
        try {
          data = JSON.parse(event.data)
        } catch (e) {
          return e
        }
      }

      if (this.options.debug) {
        logger.log('Received message', data)
      }

      const { type, params, id } = data

      let pendingPromise

      // eslint-disable-next-line no-cond-assign
      if (id && (pendingPromise = this.pendingPromises[id])) {
        finalizePendingPromise(pendingPromise, params)
        return
      }

      if (type) {
        this.handlers.triggerHandlers(type, params)
      }
    })
  }

  rawPostMessage(data: Record<string, any>) {
    const msg = JSON.stringify({ ...data, appGuid: this.options.appGuid })

    if (this.options.debug) {
      logger.log('Sending message to client', {
        ...data,
        appGuid: this.options.appGuid ?? null,
      })
    }

    this.parentWindow?.postMessage(msg, '*')
  }

  private postMessage(type: ClientProxyType, params: Record<string, any>) {
    this.rawPostMessage({ type, params })
  }

  /**
   * Wraps a instrument function using Promises.
   */
  private wrappedPostMessageWithPromise(
    type: ClientProxyType,
    params: Record<string, any> = {}
  ): Promise<any> {
    const pendingId = `${type}:${this.handlers.nextIdFor(type)}`

    const promise = new Promise((resolve, reject) => {
      this.pendingPromises[pendingId] = { resolve, reject }

      this.postMessage(type, {
        ...params,
        pendingId,
      })
    })

    return promise.then(
      removePromise.bind(null, { id: pendingId, pendingPromises: this.pendingPromises }),
      removePromise.bind(null, { id: pendingId, pendingPromises: this.pendingPromises })
    )
  }

  on(name: string, handler: (...arg: any[]) => any) {
    if (typeof handler === 'function') {
      const id = this.handlers.instrument(`on:${name}`, async (...arg: any[]) => {
        let isReject = false
        let response

        try {
          response = (await handler(...arg)) ?? true
        } catch (e: any) {
          response = e?.name
            ? {
                name: e.name,
                message: e.message,
              }
            : e

          isReject = true
        }

        isReject = typeof response === 'string' || response === false

        switch (name) {
          // ticket.save hook need to be handled differently
          case 'ticket.save':
            this.rawPostMessage({
              id,
              params: isReject
                ? {
                    error: response,
                    result: null,
                  }
                : {
                    error: null,
                    result: response,
                  },
            })
            break
          default:
            break
        }
      })

      this.postMessage('on', { name, id })
    }
  }

  off(name: string, handler: (...arg: any[]) => any) {
    if (typeof handler === 'function') {
      this.handlers.deleteInstrumentationHandler(name, handler)
      const id = this.handlers.getHandlerId(handler)

      if (!this.handlers.getHandlerLength(name)) {
        this.postMessage('off', { name, id })
      }
    }
  }

  has(name: string, handler: (...arg: any[]) => any): boolean {
    if (typeof handler === 'function') {
      return this.handlers.has(name, handler)
    }

    return false
  }

  trigger(name: string, data: any) {
    this.postMessage('trigger', { name, data })
  }

  async request(options: string | Record<string, any>) {
    return this.wrappedPostMessageWithPromise('request', { options })
  }

  async instance(instanceGuid: string) {
    const { error } = await this.wrappedPostMessageWithPromise('instance', { instanceGuid })

    if (!error) {
      return new ZAFClientProxy({
        appGuid: instanceGuid,
      })
    }

    return Promise.reject(error)
  }

  async metadata() {
    return this.wrappedPostMessageWithPromise('metadata')
  }

  async context() {
    return this.wrappedPostMessageWithPromise('context')
  }

  async get<T extends string>(path: T): Promise<{ [K in T]: Record<string, any> }> {
    return this.wrappedPostMessageWithPromise('get', { path })
  }

  async set(...arg: any[]) {
    return this.wrappedPostMessageWithPromise('set', { arg })
  }

  async invoke(...arg: any[]) {
    return this.wrappedPostMessageWithPromise('invoke', { arg })
  }
}
