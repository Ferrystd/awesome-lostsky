import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const venv = join(root, '.wiki-venv')
const venvPython = join(venv, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
const action = process.argv[2]

function commandWorks(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  return result.status === 0
}

function findPython() {
  const candidates = process.env.PYTHON ? [process.env.PYTHON] : process.platform === 'win32'
    ? [
        join(process.env.LOCALAPPDATA ?? '', 'Programs/Python/Python311/python.exe'),
        'python',
      ]
    : ['python3', 'python']

  for (const candidate of candidates) {
    if (candidate && commandWorks(candidate, ['-c', 'import sys; assert sys.version_info >= (3, 10)'])) return candidate
  }

  throw new Error('Zensical 需要 Python 3.10+。请安装后设置 PYTHON 环境变量，再运行 npm run docs:setup。')
}

function setup() {
  const python = findPython()
  if (!existsSync(venvPython)) execFileSync(python, ['-m', 'venv', venv], { cwd: root, stdio: 'inherit' })
  execFileSync(venvPython, ['-m', 'pip', 'install', '--requirement', 'docs/requirements.txt'], { cwd: root, stdio: 'inherit' })
}

function serve() {
  const server = spawn(venvPython, ['-m', 'zensical', 'serve', '--config-file', 'zensical.toml'], {
    cwd: root,
    stdio: 'inherit',
  })
  const stop = () => server.kill()
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  server.on('exit', (code) => process.exit(code ?? 0))
}

if (action === 'setup') {
  setup()
} else if (action === 'build' || action === 'serve') {
  if (!existsSync(venvPython)) throw new Error('缺少 Wiki 依赖。请先运行 npm run docs:setup。')
  if (action === 'serve') {
    serve()
  } else {
    execFileSync(venvPython, ['-m', 'zensical', 'build', '--config-file', 'zensical.toml', '--clean', '--strict'], {
      cwd: root,
      stdio: 'inherit',
    })
  }
} else {
  throw new Error('用法：node frontend/scripts/wiki.mjs <setup|build|serve>')
}
