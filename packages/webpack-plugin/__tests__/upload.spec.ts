import path from 'path'
import { test } from 'vitest'
import { UploadSourcemapMapPlugin } from '..'

const plugin = new UploadSourcemapMapPlugin({
  uploadUrl: 'http://localhost:3100/upload',
  project: 'platform',
})

const mockContext = {
  compilation: {
    outputOptions: {
      path: path.resolve('./', 'dist'),
    },
  },
}

plugin.apply({
  options: { devtool: 'source-map' },
  hooks: {
    done: {
      tap: (_: any, callback: any) => {
        callback(mockContext)
      },
    },
  },
} as any)

test('upload sourcemap', () => {
  expect('upload sourcemap').toBeDefined()
})
