/** Public Kalix CLI runtime boundary invariants. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type PackageManifest = {
  name?: unknown
  dependencies?: unknown
  peerDependencies?: unknown
  peerDependenciesMeta?: unknown
}

function readManifest(relativePath: string): PackageManifest {
  return JSON.parse(readFileSync(resolve(import.meta.dirname, '../..', relativePath), 'utf8')) as PackageManifest
}

function stringKeys(value: unknown): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.keys(value)
}

function optionalPeerNames(manifest: PackageManifest): Set<string> {
  if (manifest.peerDependenciesMeta === null || typeof manifest.peerDependenciesMeta !== 'object'
    || Array.isArray(manifest.peerDependenciesMeta)) return new Set()

  return new Set(Object.entries(manifest.peerDependenciesMeta)
    .filter(([, metadata]) => metadata !== null && typeof metadata === 'object' && !Array.isArray(metadata)
      && (metadata as { optional?: unknown }).optional === true)
    .map(([name]) => name))
}

describe('Kalix CLI runtime boundary', () => {
  it('uses the public Kalix name while preserving an explicit boot dependency closure', () => {
    const cli = readManifest('apps/cli/package.json')
    const appBoot = readManifest('packages/boot/app-boot/package.json')

    expect(cli.name).toBe('@kalix-code/kalix')

    const cliDependencies = new Set(stringKeys(cli.dependencies))
    const requiredBootPeers = stringKeys(appBoot.peerDependencies)
      .filter(name => !optionalPeerNames(appBoot).has(name))

    expect(requiredBootPeers).not.toHaveLength(0)
    expect(requiredBootPeers.every(name => cliDependencies.has(name))).toBe(true)
  })
})
