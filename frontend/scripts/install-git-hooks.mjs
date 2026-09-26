import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))

function git(args, options = {}) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', ...options }).trim()
}

let configured = ''
try {
  configured = git(['config', '--get', 'core.hooksPath'])
} catch (error) {
  if (error.status !== 1) throw error
}

if (configured && resolve(root, configured) !== join(root, '.githooks')) {
  throw new Error(`当前 core.hooksPath 为 ${configured}；为避免覆盖现有钩子，请先人工合并，再设置为 .githooks。`)
}

const commonDirValue = git(['rev-parse', '--git-common-dir'])
const commonDir = isAbsolute(commonDirValue) ? commonDirValue : resolve(root, commonDirValue)
const legacyHook = join(commonDir, 'hooks', 'pre-commit')
if (!configured && existsSync(legacyHook)) {
  throw new Error(`检测到已有 ${legacyHook}；为避免使其失效，请先人工合并到 .githooks/pre-commit。`)
}

git(['config', '--local', 'core.hooksPath', '.githooks'])
console.log('已安装项目 Git hooks：core.hooksPath=.githooks')
