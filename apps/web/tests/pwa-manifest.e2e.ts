import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const DIST_ROOT = fileURLToPath(new URL('../dist', import.meta.url))

it('ships install metadata with the built web application', async () => {
  const index = await readFile(join(DIST_ROOT, 'index.html'), 'utf8')
  expect(index).toContain('<link rel="manifest" href="/manifest.webmanifest" />')

  const manifest: unknown = JSON.parse(await readFile(join(DIST_ROOT, 'manifest.webmanifest'), 'utf8'))
  expect(manifest).toEqual({
    id: '/',
    name: 'Kalix Code',
    short_name: 'Kalix',
    start_url: '/',
    scope: '/',
    display: 'fullscreen',
    icons: [{
      src: '/kalix-code-mascot.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    }],
  })
})

it('ships the Kalix Code mascot icon', async () => {
  const icon = await readFile(join(DIST_ROOT, 'kalix-code-mascot.png'))
  expect(icon.byteLength).toBeGreaterThan(0)
})
