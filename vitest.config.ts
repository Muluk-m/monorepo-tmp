import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['packages/**/__tests__/*.spec.ts'],
    globals: true,
    sequence: {
      hooks: 'list',
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
    },
  },
})
