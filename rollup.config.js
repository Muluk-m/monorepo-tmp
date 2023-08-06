import path from 'path'
import commonJS from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import chalk from 'chalk'
import typescript from 'rollup-plugin-typescript2'
import { getBuildOptions } from './scripts/config'

if (!process.env.TARGET) {
  throw new Error('TARGET package must be specified via --environment flag.')
}

const packageName = process.env.TARGET
const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)

const resolve = (p) => path.resolve(packageDir, p)
const packageOptions = getBuildOptions(packageName) || {}
const name = packageOptions.filename || path.basename(packageDir)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require(resolve('package.json'))

const outputConfigs = {
  esm: {
    file: resolve(`dist/${name}.esm.js`),
    format: 'es',
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs',
  },
}

const defaultFormats = ['esm', 'cjs']
const packageFormats = packageOptions.formats || defaultFormats
const packageConfigs = packageFormats.map((format) =>
  createConfig(format, outputConfigs[format], packageOptions.plugins || [])
)

export default packageConfigs

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(chalk.yellow(`invalid format: "${format}"`))
    process.exit(1)
  }

  const isNodeBuild = format === 'cjs'

  output.exports = 'named'

  if (isNodeBuild) {
    output.esModule = true
  }
  output.externalLiveBindings = false

  const entryFile = 'src/index.ts'

  function resolveExternal() {
    const treeShakenDeps = ['source-map', '@babel/parser', 'estree-walker']

    return [
      ...(packageOptions.external || []),
      ...Object.keys(pkg.peerDependencies || {}),
      ...['path', 'url', 'stream', 'fs', 'child_process', 'events'],
      // somehow these throw warnings for runtime-* package builds
      ...treeShakenDeps,
    ]
  }

  return {
    input: resolve(entryFile),
    external: resolveExternal(),
    plugins: [
      json(),
      nodeResolve({
        preferBuiltins: true,
        mainFields: ['browser'],
      }),
      ...plugins,
      typescript({
        tsconfigOverride: {
          include: [`packages/${packageName}/src`],
          exclude: ['node_modules'],
        },
        useTsconfigDeclarationDir: true,
        tsconfig: path.resolve(__dirname, 'tsconfig.build.json'),
        check: false,
      }),
      commonJS({
        sourceMap: false,
      }),
    ],
    output,
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg)
      }
    },
    // FIXME: moduleSideEffects 会导致 postcss 的一些副作用逻辑被 shake 掉，
    // 这是不符合预期的，故先关闭此配置
    // treeshake: {
    //   moduleSideEffects: false,
    // },
  }
}
