const path = require('path')
const { prompt } = require('enquirer')
const fs = require('fs')
const chalk = require('chalk')
const semver = require('semver')
const consola = require('consola')
const { run, targets } = require('./utils')
const curVersion = require('../package.json').version

const packages = targets
const tag = process.env.npm_config_tag
const getPkgRoot = (pkg) => path.resolve(__dirname, `../packages/${pkg}`)
const step = (msg) => console.log(chalk.cyan(msg))

async function publishPackage(pkgName) {
  const pkgRoot = getPkgRoot(pkgName)
  const pkgPath = path.resolve(pkgRoot, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  if (pkg.private) {
    return
  }
  step(`Publishing ${pkgName}...`)
  try {
    await run('npm', ['publish', '--registry=https://registry.npmjs.org', `--tag=${tag}`], {
      cwd: pkgRoot,
      stdio: 'pipe',
    })
    consola.success(chalk.green(`Successfully published ${pkgName}@${pkg.version}`))
  } catch (e) {
    if (e.stderr.match(/previously published/)) {
      console.log(chalk.red(`Skipping already published: ${pkgName}`))
    } else {
      throw e
    }
  }
}

async function main() {
  // publish packages
  step('\nPublishing packages...')
  for (const pkg of packages) {
    await publishPackage(pkg)
  }
}

main()
