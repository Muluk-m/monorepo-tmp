import { existsSync, readdirSync } from 'fs'
import dts from 'rollup-plugin-dts'

if (!existsSync('temp/packages')) {
  console.warn('no temp dts files found. run `tsc -p tsconfig.build.json` first.')
  process.exit(1)
}

export default readdirSync('temp/packages').map((pkg) => {
  return {
    input: `./temp/packages/${pkg}/src/index.d.ts`,
    output: {
      file: `packages/${pkg}/dist/${pkg}.d.ts`,
      format: 'es',
    },
    plugins: [dts()],
    onwarn(warning, warn) {
      // during dts rollup, everything is externalized by default
      if (
        warning.code === 'UNRESOLVED_IMPORT' &&
        warning.exporter &&
        !warning.exporter.startsWith('.')
      ) {
        return
      }
      warn(warning)
    },
  }
})
