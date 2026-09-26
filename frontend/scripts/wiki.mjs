import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const venv = join(root, '.wiki-venv')
const venvPython = join(venv, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
const action = process.argv[2]
const target = process.argv[3] ?? 'docs'
const configs = {
  docs: 'zensical.toml',
  guide: 'zensical.guide.toml',
}

function commandWorks(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  return result.status === 0
}

function findPython() {
  const candidates = process.env.PYTHON ? [process.env.PYTHON] : process.platform === 'win32'
    ? [
        join(process.env.LOCALAPPDATA ?? '', 'Programs/Python/Python312/python.exe'),
        'python',
      ]
    : ['python3', 'python']

  for (const candidate of candidates) {
    if (candidate && commandWorks(candidate, ['-c', 'import sys; assert sys.version_info >= (3, 12)'])) return candidate
  }

  throw new Error('Zensical glossary 需要 Python 3.12+。请安装后设置 PYTHON 环境变量，再运行 npm run docs:setup。')
}

function setup() {
  const python = findPython()
  if (existsSync(venvPython) && !commandWorks(venvPython, ['-c', 'import sys; assert sys.version_info >= (3, 12)'])) {
    rmSync(venv, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  }
  if (!existsSync(venvPython)) execFileSync(python, ['-m', 'venv', venv], { cwd: root, stdio: 'inherit' })
  execFileSync(venvPython, ['-m', 'pip', 'install', '--requirement', 'docs/dev/requirements.txt'], { cwd: root, stdio: 'inherit' })
}

function serve() {
  const config = configs[target]
  if (!config) throw new Error(`未知文档站：${target}`)

  const server = spawn(venvPython, ['-m', 'zensical', 'serve', '--config-file', config], {
    cwd: root,
    stdio: 'inherit',
  })
  const stop = () => server.kill()
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  server.on('exit', (code) => process.exit(code ?? 0))
}

if (action === 'metadata' || action === 'metadata-write') {
  execFileSync(venvPython, ['frontend/scripts/guide_metadata.py', ...(action === 'metadata-write' ? ['--write-index'] : [])], { cwd: root, stdio: 'inherit' })
} else if (action === 'setup') {
  setup()
} else if (action === 'build' || action === 'serve') {
  if (!existsSync(venvPython)) throw new Error('缺少 Wiki 依赖。请先运行 npm run docs:setup。')
  if (action === 'build' || target === 'guide') {
    execFileSync(venvPython, ['frontend/scripts/guide_metadata.py'], { cwd: root, stdio: 'inherit' })
  }
  if (action === 'serve') {
    serve()
  } else {
    for (const config of Object.values(configs)) {
      execFileSync(venvPython, ['-m', 'zensical', 'build', '--config-file', config, '--clean', '--strict'], {
        cwd: root,
        stdio: 'inherit',
      })
    }
  }
} else {
  throw new Error('用法：node frontend/scripts/wiki.mjs <setup|build|serve>')
}
