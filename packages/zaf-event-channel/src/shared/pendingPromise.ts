import { PendingPromise } from '../types'

export function createError(error: Error & { path?: string }) {
  if (error.path) {
    error.message = `"${error.path}" ${error.message}`
  }
  const err = new Error(error.message)
  err.name = error.name
  err.stack = error.stack
  return err
}

export function finalizePendingPromise(pendingPromise: PendingPromise, data: any) {
  if (data.error) {
    const err = data.error?.name ? createError(data.error) : new Error(data.error)
    pendingPromise.reject(err)
  } else {
    pendingPromise.resolve(data.result)
  }
}

export function removePromise(
  options: { id: string; pendingPromises: Record<string, PendingPromise> },
  args: any
) {
  delete options.pendingPromises[options.id]
  if (args instanceof Error) throw args
  return args
}
