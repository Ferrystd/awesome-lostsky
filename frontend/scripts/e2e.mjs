import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { coverageErrors, planGroups, reportTests, sitePort } from './e2e-plan.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
const cli = join(dirname(require.resolve('@playwright/test/package.json')), 'cli.js')
const args = process.argv.slice(2)
async function run(options, env = {}) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [cli, 'test', ...options], {
      cwd: root, windowsHide: true, stdio: 'inherit', env: { ...process.env, ...env },
    })
    child.once('error', reject)
    child.once('exit', (code, signal) => done(code ?? (signal ? 1 : 0)))
  })
}
if (args.includes('--list') || args.includes('--help') || args.includes('-h')) {
  process.exit(await run(args))
}
// These options are owned by the bounded runner; reject rather than silently override them.
for (const arg of args) {
  if (/^(?:--config|-c|--workers|-j|--reporter|--output|--test-list|--test-list-invert|--shard|--ui|--debug)(?:=|$)/.test(arg)) {
    throw new Error(`${arg} is managed by the grouped E2E runner. Use file/-g/--project filters; use npx playwright test for interactive custom configurations.`)
  }
}
const output = join(root, 'test-results/e2e', new Date().toISOString().replaceAll(':', '-'))
mkdirSync(output, { recursive: true })
const discoveryPath = join(output, 'discovery.json')
const serverPath = join(output, 'servers.json')
const discoveryConfig = join(output, 'discovery.config.ts')
const baseImport = JSON.stringify(join(root, 'playwright.config.ts').replaceAll('\\', '/'))
// Playwright's JSON reporter omits the server array; capture the actual config at load time.
writeFileSync(discoveryConfig, `import base from ${baseImport}\nimport { writeFileSync } from 'node:fs'\nimport { resolve } from 'node:path'\nwriteFileSync(${JSON.stringify(serverPath)}, JSON.stringify(base.webServer))\nexport default { ...base, forbidOnly: true, testDir: resolve(${JSON.stringify(root)}, base.testDir ?? 'tests') }\n`)
if (await run([...args, `--config=${discoveryConfig}`, '--list', '--reporter=json'], { PLAYWRIGHT_JSON_OUTPUT_NAME: discoveryPath })) process.exit(1)
const discovery = JSON.parse(readFileSync(discoveryPath, 'utf8'))
const expected = reportTests(discovery)
const serverConfig = JSON.parse(readFileSync(serverPath, 'utf8'))
const servers = Array.isArray(serverConfig) ? serverConfig : [serverConfig]
const groups = planGroups(expected, servers, file => readFileSync(resolve(discovery.config.rootDir, file), 'utf8'), { '5173': sitePort(process.env.E2E_SITE_PORT) })
const manifest = { startedAt: new Date().toISOString(), selected: expected, groups: [], errors: [] }
const manifestPath = join(output, 'manifest.json')
const actual = []
let failed = false
console.log(`E2E: ${expected.length} tests in ${groups.length} sequential server groups (1 worker). Evidence: ${output}`)
for (const [index, group] of groups.entries()) {
  const config = join(output, `${group.id}.config.ts`)
  const list = join(output, `${group.id}.txt`)
  const report = join(output, `${group.id}.json`)
  // --test-list uses project + file; original grep/file/project filters still apply.
  const entries = [...new Set(group.tests.map(test => `[${test.project}] › ${test.file}`))]
  writeFileSync(list, entries.join('\n'))
  writeFileSync(config, `import base from ${JSON.stringify(join(root, 'playwright.config.ts').replaceAll('\\', '/'))}\nexport default { ...base, forbidOnly: true, testDir: ${JSON.stringify(discovery.config.rootDir)}, workers: 1, outputDir: ${JSON.stringify(join(output, `results-${group.id}`))}, webServer: base.webServer.filter(server => ${JSON.stringify(group.ports)}.includes(new URL(server.url).port)).map(server => ({ ...server, cwd: ${JSON.stringify(root)} })) }\n`)
  console.log(`E2E group ${index + 1}/${groups.length}: ${group.id} (${group.tests.length} tests)`)
  const code = await run([...args, `--config=${config}`, `--test-list=${list}`, '--reporter=list,json'], { PLAYWRIGHT_JSON_OUTPUT_NAME: report })
  const result = existsSync(report) ? JSON.parse(readFileSync(report, 'utf8')) : null
  const completed = result ? reportTests(result) : []
  const errors = coverageErrors(group.tests, completed)
  if (code || errors.length || result?.errors?.length) failed = true
  actual.push(...completed)
  manifest.groups.push({ id: group.id, code, report, stats: result?.stats ?? null, errors })
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
}
manifest.errors = coverageErrors(expected, actual)
manifest.finishedAt = new Date().toISOString()
manifest.passed = !failed && !manifest.errors.length
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`E2E ${manifest.passed ? 'PASS' : 'FAIL'}: ${actual.length}/${expected.length} tests; ${manifestPath}`)
process.exitCode = manifest.passed ? 0 : 1
