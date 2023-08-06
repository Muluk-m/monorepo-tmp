import type { ClientProxyType, Func, Client, PendingPromise } from './types'
import { makeLogger, isValidEventByFrame, finalizePendingPromise, removePromise } from './shared'

const logger = makeLogger({
  prefix: 'EventChannel',
})

const handlers: Record<string, Func> = {}

interface ClientEventChannelOptions {
  client: Client
  frame: HTMLIFrameElement
  debug?: boolean
}

export class ZAFClientEventChannel {
  constructor(private options: ClientEventChannelOptions) {
    this.initEventListener()
    this.initAppGuid(options.client)
  }

  private instances: Record<string, Client> = {}

  private appGuid: string | null = null

  private pendingPromises: Record<string, PendingPromise> = {}

  private async initAppGuid(client: Client) {
    const { instanceGuid } = (await client.context()) || {}

    this.appGuid = instanceGuid
    this.instances[instanceGuid] = client
  }

  private initEventListener() {
    window.addEventListener('message', (event) => {
      if (!isValidEventByFrame(event, this.options.frame)) {
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

      const { type, params, appGuid, id } = data || {}

      if (this.options.debug) {
        logger.log('receive message', data)
      }

      let pendingPromise

      // eslint-disable-next-line no-cond-assign
      if (id && (pendingPromise = this.pendingPromises[id])) {
        finalizePendingPromise(pendingPromise, params)
        return
      }

      if (type) {
        this.messageHandler(type, params, appGuid || this.appGuid)
      }
    })
  }

  private getClient(appGuid: string) {
    const client = this.instances[appGuid]

    if (!client) {
      throw new Error('Client not found')
    }

    return client
  }

  private rawPostMessage(data: Record<string, any>) {
    const msg = JSON.stringify(data)

    if (this.options.debug) {
      logger.log('send message', data)
    }

    this.options.frame.contentWindow?.postMessage(msg, '*')
  }

  private postReplyMessage(type: string, data: Record<string, any>) {
    this.rawPostMessage({
      type,
      params: data,
    })
  }

  private async wrappedReplyMessageWithPromise(
    id: string,
    promise: () => Promise<any>,
    interceptor?: (response: any) => any
  ) {
    try {
      let response = await promise()

      if (interceptor && typeof interceptor === 'function') {
        response = interceptor(response)
      }

      this.rawPostMessage({
        id,
        params: {
          error: null,
          result: response,
        },
      })
    } catch (e: any) {
      this.rawPostMessage({
        id,
        params: {
          error: e?.message ? e.message : e,
          result: {},
        },
      })
    }
  }

  private messageHandler(type: ClientProxyType, params: any, appGuid: string) {
    const client = this.getClient(appGuid)

    switch (type) {
      case 'on':
        this.handleOnEvent(params, client)
        break
      case 'off':
        this.handleOffEvent(params, client)
        break
      case 'has':
        // 不需要
        break
      case 'trigger':
        this.handleTriggerEvent(params, client)
        break
      case 'request':
        this.handleRequestEvent(params, client)
        break
      case 'instance':
        this.handleInstanceEvent(params, client)
        break
      case 'metadata':
        this.handleMetadataEvent(params, client)
        break
      case 'context':
        this.handleContextEvent(params, client)
        break
      case 'get':
        this.handleGetEvent(params, client)
        break
      case 'set':
        this.handleSetEvent(params, client)
        break
      case 'invoke':
        this.handleInvokeEvent(params, client)
        break
      default:
        logger.warn('unknown instrumentation type:', type)
    }
  }

  handleOnEvent(params: Record<string, any>, client: Client) {
    const { name, id } = params || {}
    const eventName = `on:${name}`

    const handler = (data: Record<string, any>) => {
      this.postReplyMessage(eventName, data)

      const promise = new Promise<any>((resolve, reject) => {
        this.pendingPromises[id] = { resolve, reject }
      })

      return promise.then(
        removePromise.bind(null, { id, pendingPromises: this.pendingPromises }),
        removePromise.bind(null, { id, pendingPromises: this.pendingPromises })
      )
    }

    if (!handlers[id]) {
      handlers[id] = handler
    } else {
      logger.error('Handler id already exists')
    }

    client.on(name, handler)
  }

  handleOffEvent(params: Record<string, any>, client: Client) {
    const { name, id } = params || {}
    const handler = handlers[id]

    delete handlers[id]

    if (!handler) {
      logger.error('Handler id already exists')
    }

    client.off(name, handler)
  }

  handleTriggerEvent(params: Record<string, any>, client: Client) {
    const { name, data } = params || {}

    client.trigger(name, data)
  }

  async handleRequestEvent(params: Record<string, any>, client: Client) {
    const { options, pendingId } = params || {}

    this.wrappedReplyMessageWithPromise(pendingId, () => client.request(options))
  }

  /**
   *
   * @param {object} params
   * @param {string} params.instanceGuid
   */
  async handleInstanceEvent(params: Record<string, any>, client: Client) {
    const { instanceGuid, pendingId } = params || {}

    this.wrappedReplyMessageWithPromise(
      pendingId,
      () => client.instance(instanceGuid),
      (instance) => {
        // 缓存 instance，等待客户端调用
        this.instances[instanceGuid] = instance

        return instanceGuid
      }
    )
  }

  async handleMetadataEvent(params: Record<string, any>, client: Client) {
    const { pendingId } = params || {}

    this.wrappedReplyMessageWithPromise(pendingId, () => client.metadata())
  }

  async handleContextEvent(params: Record<string, any>, client: Client) {
    const { pendingId } = params || {}

    this.wrappedReplyMessageWithPromise(pendingId, () => client.context())
  }

  async handleGetEvent(params: Record<string, any>, client: Client) {
    const { path, pendingId } = params || {}

    this.wrappedReplyMessageWithPromise(pendingId, () => client.get(path))
  }

  async handleSetEvent(params: Record<string, any>, client: Client) {
    const { arg, pendingId } = params || {}

    this.wrappedReplyMessageWithPromise(pendingId, () => client.set(...arg))
  }

  async handleInvokeEvent(params: Record<string, any>, client: Client) {
    const { arg, pendingId } = params || {}
    let invokeArg = arg || []
    const [type, parameters = {}] = invokeArg

    // resize need sync to iframe
    if (type === 'resize') {
      if (parameters.width) {
        // eslint-disable-next-line no-restricted-globals
        this.options.frame.style.width = isNaN(parameters.width)
          ? parameters.width
          : `${parameters.width}px`
      }
      if (parameters.height) {
        // eslint-disable-next-line no-restricted-globals
        this.options.frame.style.height = isNaN(parameters.height)
          ? parameters.height
          : `${parameters.height}px`
        // 额外增加 10px 适配高度
        invokeArg = [type, { ...parameters, height: parameters.height + 10 }]
      }
    }

    this.wrappedReplyMessageWithPromise(pendingId, () => client.invoke(...invokeArg))
  }
}

/**
 *
 * @param {object} options
 * @param {HTMLIFrameElement} options.frame
 */
export function initZAFEventChannel(options: ClientEventChannelOptions) {
  return new ZAFClientEventChannel(options)
}
