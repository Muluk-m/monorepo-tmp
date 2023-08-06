import type { Func } from '../types'

export function makeLogger(options: { prefix: string } = { prefix: '' }) {
  const CONSOLE_LEVELS = ['debug', 'info', 'warn', 'error', 'log', 'assert', 'trace'] as const

  const rawLogger = {} as Record<(typeof CONSOLE_LEVELS)[number], Func>

  CONSOLE_LEVELS.forEach((name) => {
    rawLogger[name] = (...args) => {
      console[name](`%c${options.prefix} [${name}]:`, 'color: #00a0e9', ...args)
    }
  })

  return rawLogger
}

export const logger = makeLogger()
