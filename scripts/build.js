const fs = require('fs-extra')
const chalk = require('chalk')
const consola = require('consola')
const { gzipSync } = require('zlib')
const { run } = require('./utils')
const path = require('path')
const args = require('minimist')(process.argv.slice(2))
const { targets: allTargets, fuzzyMatchTarget } = require('./utils')
const { spawn } = require('child_process')
const targets = args._
const buildAllMatching = args.all || args.a
const distName = 'dist'

runBuild()

async function runBuild() {
  consola.info('Build Packages')

  if (!targets.length) {
    await buildAll(allTargets)
    await buildDts()
    checkAllSizes(allTargets)
  } else {
    await buildAll(fuzzyMatchTarget(targets, buildAllMatching))
    await buildDts()
    checkAllSizes(fuzzyMatchTarget(targets, buildAllMatching))
  }
  consola.success('Build finished!')
}

async function buildAll(targets) {
  await fs.remove('temp')
  await runParallel(require('os').cpus().length, targets, build)
}

async function runParallel(maxConcurrency, source, iteratorFn) {
  const ret = []
  const executing = []
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source))
    ret.push(p)

    if (maxConcurrency <= source.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }
  }
  return Promise.all(ret)
}

async function build(target) {
  const pkgDir = path.resolve(`packages/${target}`)

  await fs.remove(`${pkgDir}/${distName}`)

  run('rollup', ['-c', '--environment', `TARGET:${target}`])
}

async function buildDts() {
  run('rollup', ['-c', 'rollup.dts.config.js'])
}

function checkAllSizes(targets) {
  console.log()
  for (const target of targets) {
    checkSize(target)
  }
  console.log()
}

function checkSize(target) {
  const pkgDir = path.resolve(`packages/${target}`)
  checkFileSize(`${pkgDir}/${distName}/${target}.cjs.js`)
  checkFileSize(`${pkgDir}/${distName}/${target}.esm.js`)
}

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }
  const file = fs.readFileSync(filePath)
  const minSize = (file.length / 1024).toFixed(2) + 'kb'
  const gzipped = gzipSync(file)
  const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb'
  consola.info(
    `${chalk.gray(chalk.bold(path.basename(filePath)))} min:${minSize} / gzip:${gzippedSize}`
  )
}
