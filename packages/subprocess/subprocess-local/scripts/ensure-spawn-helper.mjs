/** Restore the executable bit stripped from node-pty's prebuilt helper. */

import { chmodSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

let entry
try {
  entry = fileURLToPath(import.meta.resolve('node-pty'))
} catch (_optionalNodePtyIsNotInstalled) {
  // Android/Termux can omit node-pty because upstream does not ship an Android prebuild.
  // The runtime then reports an actionable error only if an interactive PTY is requested.
  process.exit(0)
}
const packageRoot = dirname(dirname(entry))
const candidates = [
  join(packageRoot, 'prebuilds', `${process.platform}-${process.arch}`, 'spawn-helper'),
  join(packageRoot, 'build', 'Release', 'spawn-helper'),
]

for (const helper of candidates) {
  if (existsSync(helper)) chmodSync(helper, 0o755)
}
