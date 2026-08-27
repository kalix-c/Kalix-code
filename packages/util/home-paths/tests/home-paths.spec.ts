import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_DSH_HOME_DISPLAY,
  DSH_HOME_DIR_NAME,
  canonicalizeWatchPath,
  defaultDshHome,
  dshHomeDisplay,
  dshHomePath,
  expandHomePath,
  resolveDshHome,
} from '@deepseek-ai/dsh-home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Kalix path helpers', () => {
  it('owns the shared default Kalix home directory name', () => {
    expect(DSH_HOME_DIR_NAME).toBe('.kalix')
    expect(DEFAULT_DSH_HOME_DISPLAY).toBe('~/.kalix')
    expect(defaultDshHome()).toBe(join(homedir(), '.kalix'))
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.kalix')).toBe(join(homedir(), '.kalix'))
    expect(expandHomePath('~\\.kalix')).toBe(join(homedir(), '.kalix'))
    expect(expandHomePath('/tmp/.kalix')).toBe('/tmp/.kalix')
    expect(expandHomePath('~other/.kalix')).toBe('~other/.kalix')
  })

  it('resolves explicit path before KALIX_HOME and the default', () => {
    const envHome = join(homedir(), 'env-kalix')

    expect(resolveDshHome('/tmp/explicit-kalix', { KALIX_HOME: '~/env-kalix' })).toBe(resolve('/tmp/explicit-kalix'))
    expect(resolveDshHome(undefined, { KALIX_HOME: '~/env-kalix' })).toBe(envHome)
    expect(resolveDshHome(undefined, {})).toBe(defaultDshHome())
  })

  it('treats an empty or whitespace-only KALIX_HOME as unset', () => {
    expect(resolveDshHome(undefined, { KALIX_HOME: '' })).toBe(defaultDshHome())
    expect(resolveDshHome(undefined, { KALIX_HOME: '   ' })).toBe(defaultDshHome())
  })

  it('joins child segments onto the resolved KALIX_HOME', () => {
    vi.stubEnv('KALIX_HOME', '~/env-kalix')
    expect(dshHomePath()).toBe(join(homedir(), 'env-kalix'))
    expect(dshHomePath('storages', 'cache')).toBe(join(homedir(), 'env-kalix', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(dshHomeDisplay(resolve(defaultDshHome()))).toBe('~/.kalix')
    expect(dshHomeDisplay('/some/other/root')).toBe('$KALIX_HOME')
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
