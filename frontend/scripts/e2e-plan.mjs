/** Keep discovery and execution comparable without depending on source line numbers. */
export function reportTests(report) {
  const tests = []
  function visit(suite, parents = []) {
    const titles = suite.title === suite.file ? parents : [...parents, suite.title]
    for (const spec of suite.specs ?? []) for (const test of spec.tests) {
      const titlePath = [...titles, spec.title]
      const file = spec.file.replaceAll('\\', '/')
      tests.push({ file, titlePath, project: test.projectName, status: test.status,
        key: JSON.stringify([test.projectName, file, ...titlePath]) })
    }
    for (const child of suite.suites ?? []) visit(child, titles)
  }
  for (const suite of report.suites ?? []) visit(suite)
  return tests
}

export function planGroups(tests, servers, readSource) {
  if (!tests.length) throw new Error('No E2E tests discovered')
  if (new Set(tests.map(test => test.key)).size !== tests.length) throw new Error('Duplicate E2E test identity')
  const groups = new Map()
  for (const file of new Set(tests.map(test => test.file))) {
    const source = readSource(file)
    if (!/from\s+['"](?:\.\.\/|\.\/)+fixtures['"]/.test(source) || /from\s+['"]@playwright\/test['"]/.test(source)) {
      throw new Error(`${file} must import the shared API-isolated test fixture`)
    }
    if (/\bnewContext\s*\(|\blaunchPersistentContext\s*\(|\bbrowser\s*\.\s*newPage\s*\(|\b(?:page|context)\s*\.\s*request\b|\bAPIRequestContext\b|\brequest\s*\.\s*(?:get|post|put|patch|delete|fetch|head)\s*\(/.test(source)) {
      throw new Error(`${file} creates requests outside the guarded browser context; use a separate real HTTP smoke test or extend the shared isolation fixture first`)
    }
    const ports = servers.map(server => new URL(server.url).port)
      .filter(port => new RegExp(`:${port}(?!\\d)`).test(source)).sort()
    if (!ports.length) throw new Error(`No local webServer URL found in ${file}; declare its application origin in the spec`)
    const id = ports.join('-')
    if (!groups.has(id)) groups.set(id, { id, ports, tests: [] })
    groups.get(id).tests.push(...tests.filter(test => test.file === file))
  }
  return [...groups.values()].sort((a, b) => a.ports.length - b.ports.length || a.id.localeCompare(b.id))
}

export function coverageErrors(expected, actual) {
  const planned = new Set(expected.map(test => test.key))
  const seen = new Set()
  const errors = []
  for (const test of actual) {
    if (!planned.has(test.key)) errors.push(`Unexpected test: ${test.key}`)
    if (seen.has(test.key)) errors.push(`Duplicate test: ${test.key}`)
    seen.add(test.key)
    if (test.status !== 'expected') errors.push(`Not passed (${test.status}): ${test.key}`)
  }
  for (const key of planned) if (!seen.has(key)) errors.push(`Missing test: ${key}`)
  return errors
}
