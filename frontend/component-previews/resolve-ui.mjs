import path from 'node:path'

// A preview hosts both the stable shared UI and Team's application-scoped UI.
// Resolve from the importing source, just as the actual application builds do.
export function previewUiAlias(frontendRoot) {
  const sharedRoot = path.join(frontendRoot, 'packages', 'ui', 'src')
  const teamRoot = path.join(frontendRoot, 'apps', 'team', 'src')
  const normalizedTeamRoot = `${teamRoot.replaceAll('\\', '/')}/`
  return {
    find: '@lostsky/ui',
    replacement: sharedRoot,
    async customResolver(source, importer, options) {
      const target = importer?.replaceAll('\\', '/').startsWith(normalizedTeamRoot)
        ? path.join(teamRoot, 'ui', path.relative(sharedRoot, source))
        : source
      return this.resolve(target, importer, { ...options, skipSelf: true })
    },
  }
}
