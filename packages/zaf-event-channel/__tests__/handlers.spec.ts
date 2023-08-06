import { test } from 'vitest'
import { Handlers } from '../src/handlers'

import type { Func } from '../src/types'

describe('Handlers', () => {
  const handlers = new Handlers()

  // Test nextId()
  test('nextId', () => {
    const id1 = handlers.nextId()
    const id2 = handlers.nextId()
    expect(id1).toBe(1)
    expect(id2).toBe(2)
  })

  // Test instrument()
  const handler: Func = (data: any) => data * 2
  const eventName = 'testEvent'

  test('instrument', () => {
    const id = handlers.instrument(eventName, handler)
    expect(id).toBe(3)
    expect(handlers.getHandlerLength(eventName)).toBe(1)
  })

  // Test triggerHandlers()
  test('triggerHandlers', async () => {
    const resultPromise = new Promise<number>((resolve) => {
      handlers.instrument(eventName, (data) => {
        resolve(data * 3)
      })
    })

    handlers.triggerHandlers(eventName, 2)
    const result = await resultPromise
    expect(result).toBe(6)
  })

  // Test deleteInstrumentationHandler()
  test('deleteInstrumentationHandler', () => {
    handlers.deleteInstrumentationHandler(eventName, handler)
    expect(handlers.getHandlerLength(eventName)).toBe(1)
  })

  // Test getHandlerLength()
  test('getHandlerLength', () => {
    expect(handlers.getHandlerLength(eventName)).toBe(1)
    expect(handlers.getHandlerLength('nonexistent')).toBe(0)
  })

  // Test getHandlerId()
  test('getHandlerId', () => {
    const refId = handlers.instrument(eventName, handler)

    const id = handlers.getHandlerId(handler)
    expect(refId).toBe(id)
  })

  // Test has()
  test('has', () => {
    const hasHandler = handlers.has(eventName, handler)
    expect(hasHandler).toBe(true)
  })
})
