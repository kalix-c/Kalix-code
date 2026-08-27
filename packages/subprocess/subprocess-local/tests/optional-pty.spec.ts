import { describe, expect, it } from 'vitest'
import { loadPtyBackend } from '../src/index.ts'

describe('optional node-pty backend', () => {
  it('reports a precise error only when the optional terminal backend is requested', async () => {
    await expect(loadPtyBackend(async () => {
      throw new Error('module is absent')
    })).rejects.toThrow('interactive terminals are unavailable')
  })
})
