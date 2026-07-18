import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const manifestPath = resolve('frontend/media/manifest.json')
if (!existsSync(manifestPath)) throw new Error('Missing frontend/media/manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
for (const asset of manifest.assets ?? []) {
  if (!asset.path || !asset.source || !asset.rights) throw new Error(`Incomplete media record: ${JSON.stringify(asset)}`)
  if (asset.source === 'network' && !asset.licenseFile) throw new Error(`Network asset requires licenseFile: ${asset.path}`)
}
console.log(`Media manifest OK: ${manifest.assets?.length ?? 0} assets`)
