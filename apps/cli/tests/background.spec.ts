import { describe, expect, it } from 'vitest'
import { backgroundChildArgs, isBackgroundWebInvocation } from '../src/background.ts'

describe('Kalix background web launch', () => {
  it('recognizes only a web-profile request carrying the background flag', () => {
    expect(isBackgroundWebInvocation({
      mode: 'profile', profile: 'web', patches: [], args: ['--background'],
    })).toBe(true)
    expect(isBackgroundWebInvocation({
      mode: 'profile', profile: 'tui', patches: [], args: ['--background'],
    })).toBe(false)
    expect(isBackgroundWebInvocation({
      mode: 'profile', profile: 'web', patches: [], args: ['--no-open'],
    })).toBe(false)
  })

  it('removes the launcher-only flag and always suppresses a browser handoff in the child', () => {
    expect(backgroundChildArgs(['web', '--background', '--port', '8090']))
      .toEqual(['web', '--port', '8090', '--no-open'])
    expect(backgroundChildArgs(['web', '--background', '--no-open']))
      .toEqual(['web', '--no-open'])
  })
})
