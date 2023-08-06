import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import glob from 'glob'
import FormData from 'form-data'
import { Compiler } from 'webpack'

const form = new FormData()

const getHEAD = () => execSync('git rev-parse --short HEAD').toString().trim()

export class UploadSourcemapMapPlugin {
  constructor(
    private options: {
      uploadUrl: string
      project: string
      version?: string
      deleteSourcemap?: boolean
    }
  ) {}

  private async upload(files: string[]) {
    const { uploadUrl, project, version = getHEAD() } = this.options
    files.forEach((file, index) => {
      const filename = path.basename(file)
      form.append(`file.${index}`, fs.createReadStream(file), filename)
    })

    form.append('project', project)
    form.append('version', version)

    return new Promise<void>((resolve, reject) => {
      form.submit(uploadUrl, (err) => {
        if (!err) resolve()
        else reject()
      })
    })
  }

  private clean(files: string[]) {
    for (const file of files) {
      fs.unlink(file, (err) => {
        if (err) throw err
      })
    }
  }

  apply(compiler: Compiler) {
    compiler.options.devtool = 'hidden-source-map'

    compiler.hooks.done.tap('UploadSourcemapPlugin', async (status) => {
      const outputPath = status.compilation.outputOptions.path!

      if (process.env.NODE_ENV !== 'production') {
        return
      }

      if (!this.options) {
        throw new Error('[UploadSourcemapPlugin] must have options')
      }

      const files = glob.sync(path.join(outputPath, './**/*.{js.map,}'))

      await this.upload(files)

      if (this.options.deleteSourcemap ?? true) {
        this.clean(files)
      }
    })
  }
}
