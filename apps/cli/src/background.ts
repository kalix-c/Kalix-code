/**
 * Detached Kalix Web launcher for local terminals.
 *
 * `kalix web --background` re-executes this same entrypoint without the flag,
 * redirects its output to the Kalix home, and detaches the child from the
 * terminal. The browser is never opened for this mode, so closing a tab — or
 * the terminal that started it — cannot end a running local session.
 * @module @kalix-code/kalix/background
 */

import { mkdirSync, openSync } from 'node:fs'
import { dirname } from 'node:path'
import { spawn } from 'node:child_process'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'
import type { DshInvocation } from './args.ts'

/** The inner flag is intercepted by the launcher and must never reach the web profile parser. */
const BACKGROUND_FLAG = '--background'

/** True when a parsed invocation requests the detached local Web service. */
export function isBackgroundWebInvocation(invocation: DshInvocation): boolean {
  return invocation.mode === 'profile' && invocation.profile === 'web' && invocation.args.includes(BACKGROUND_FLAG)
}

/** Remove the launcher-only flag and force browser suppression in the child process. */
export function backgroundChildArgs(argv: readonly string[]): string[] {
  const result = argv.filter(argument => argument !== BACKGROUND_FLAG)
  if (!result.includes('--no-open')) result.push('--no-open')
  return result
}

/**
 * Start a detached copy of the current Kalix CLI and print its durable log location.
 * @param argv - raw user arguments following the node entrypoint.
 * @throws when the current entrypoint cannot be resolved or the child cannot start.
 */
export function startBackgroundWeb(argv: readonly string[]): void {
  const entrypoint = process.argv[1]
  if (entrypoint === undefined) throw new Error('kalix web: cannot locate the current CLI entrypoint')
  const logFile = dshHomePath('logs', 'web.log')
  mkdirSync(dirname(logFile), { recursive: true })
  const log = openSync(logFile, 'a')
  const child = spawn(process.execPath, [...process.execArgv, entrypoint, ...backgroundChildArgs(argv)], {
    detached: true,
    env: process.env,
    stdio: ['ignore', log, log],
    windowsHide: true,
  })
  child.unref()
  console.log(`kalix web: started in the background; logs: ${logFile}`)
}

/** Handle a detached Web request, returning true when normal profile boot must be skipped. */
export function launchBackgroundWeb(invocation: DshInvocation, argv: readonly string[]): boolean {
  if (!isBackgroundWebInvocation(invocation)) return false
  startBackgroundWeb(argv)
  return true
}
