/**
 * The card that declares a provider pi-ai does not ship — an OpenAI-compatible
 * gateway, a self-hosted server, or a provider newer than the installed
 * catalog.
 *
 * This is a create, not an edit, which is why it is its own card rather than
 * the provider editor with extra fields: the route id is being *chosen* here,
 * and the settings address does not exist until it is. One `settings.mutate`
 * sets the whole profile at `providers.<route>`; the key travels separately
 * through `credentials.set` under the reference the profile records, exactly as
 * an existing provider's key does.
 *
 * The only setup facts a person needs to declare are a display name, endpoint,
 * and protocol. This card derives the opaque route id from the name and then
 * asks the live endpoint for its models after the form settles. A failed probe
 * leaves the model editor available, so a gateway without a readable catalog
 * remains usable.
 *
 * There is deliberately no reasoning-effort control, here or on the editor
 * card: effort is a per-MODEL capability, and the models under one provider
 * disagree about it, so a provider-scoped control can only be set to a value
 * some of them reject. The composer's model picker offers each model its own
 * levels instead.
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DiscoveredModelView, IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { apiKeyFailure } from './apiKey.ts'
import { EditorFooter } from './EditorFooter.tsx'
import { validateDeepSeekModels } from './DeepSeekModelsEditor.tsx'
import { ModelListEditor } from './ModelListEditor.tsx'
import type { ModelDraft } from './ModelListEditor.tsx'
import { deriveKeyRef, messageOf } from './store.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** The settings namespace a hand-declared provider is written into. */
const NS = 'llm-pi-ai'
/** Wait for a pasted endpoint/key to settle before interrogating it once. */
const AUTO_DISCOVERY_DELAY_MS = 450

/**
 * Derive an internal provider id from a display name, making a collision
 * deterministic without requiring people to learn the configuration syntax.
 */
function routeFromDisplayName(displayName: string, taken: readonly string[]): string {
  const words = displayName.normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
  const stem = words === '' ? 'custom-provider' : /^[a-z]/u.test(words) ? words : `provider-${words}`
  let candidate = stem
  let ordinal = 2
  while (taken.includes(candidate)) {
    candidate = `${stem}-${String(ordinal)}`
    ordinal += 1
  }
  return candidate
}

/** Whether the typed endpoint is a safe HTTP target to interrogate. */
function isProbeableUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/** Adopt provider-disclosed metadata without manufacturing unsupported facts. */
function draftFromDiscovered(model: DiscoveredModelView): ModelDraft {
  return {
    id: model.id,
    ...model.name === undefined ? {} : { name: model.name },
    ...model.contextWindow === undefined ? {} : { contextWindow: model.contextWindow },
    ...model.maxTokens === undefined ? {} : { maxTokens: model.maxTokens },
  }
}

/** Props of {@link CustomProviderCard}. */
export interface CustomProviderCardProps {
  /** Route ids already declared, so the card refuses to shadow one. */
  taken: readonly string[]
  /** Wire protocols the adapter can serve, in the order it reports them. */
  protocols: readonly string[]
  /**
   * Revision of the `llm-pi-ai` user section this card opened at, sent with
   * the create so a route another tab declared meanwhile is a refusal rather
   * than a silent overwrite of its whole profile.
   */
  revision: number
  /** Wire faces for the write and for interrogating the endpoint. */
  api: Pick<IApiClient, 'settings' | 'credentials' | 'llm'>
  /** Section copy. */
  t: (key: keyof typeof en) => string
  /** Disable writes (read-only settings provider). */
  readOnly: boolean
  /** Close the card; `changed` reports whether a provider was created. */
  onClose: (changed: boolean) => void
}

/**
 * Render the custom-provider creation card.
 * @param props - existing routes, protocol choices, wire faces, and copy.
 * @returns the creation card.
 */
export function CustomProviderCard(props: CustomProviderCardProps): ReactNode {
  const { taken, protocols, api, t } = props
  // Captured at mount, like the editor's: the write must be judged against the
  // section this card was drafted over, not whatever it grew into meanwhile.
  const [openedAt] = useState(() => props.revision)
  const [displayName, setDisplayName] = useState('')
  const [baseURL, setBaseURL] = useState('')
  const [protocol, setProtocol] = useState(protocols[0] ?? '')
  const [keyDraft, setKeyDraft] = useState('')
  const [models, setModels] = useState<readonly ModelDraft[]>([])
  const [autoDiscovering, setAutoDiscovering] = useState(false)
  const [autoDiscoveryFailure, setAutoDiscoveryFailure] = useState<string | undefined>(undefined)
  const lastAutomaticProbe = useRef<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  /**
   * The profile write landed. Only the key write can still be outstanding, so
   * the fields that describe the provider are settled and the retry path is
   * the credential alone.
   */
  const [committed, setCommitted] = useState(false)
  const disabled = props.readOnly || busy
  /** Everything but the key stops being editable once the provider exists. */
  const profileDisabled = disabled || committed

  const displayValue = displayName.trim()
  const baseURLValue = baseURL.trim()
  const route = routeFromDisplayName(displayValue, taken)
  // Rows are checked by the same per-row validator the editor cards use, so a
  // bad row is named by its position here too. Capacities have route-level
  // fallbacks; what a route cannot default is at least one model.
  const modelFailure = validateDeepSeekModels(models)
  const keyFailure = apiKeyFailure(keyDraft)
  // The typed key with paste whitespace removed. A blank field yields an empty
  // string, which the create path reads as "no key supplied" — a route may
  // legitimately authenticate through the provider's own ambient discovery.
  const keyValue = keyDraft.trim()
  const baseURLInvalid = baseURLValue.length > 0 && !isProbeableUrl(baseURLValue)
  const ready = displayValue.length > 0 && baseURLValue.length > 0 && !baseURLInvalid && models.length > 0
    && modelFailure === undefined && keyFailure === undefined
  // The one blocked gate worth a line under the form. A satisfied card says
  // nothing at all rather than printing an empty paragraph.
  const hint = failure !== undefined || autoDiscoveryFailure !== undefined || ready || keyFailure !== undefined
    ? undefined
    : displayValue.length === 0
      ? t('customNeedsDisplayName')
      : baseURLValue.length === 0
        ? t('customNeedsBaseUrl')
        : baseURLInvalid
          ? t('customInvalidBaseUrl')
          : modelFailure !== undefined
          ? `${t('model')} ${String(modelFailure.index + 1)}: ${t(modelFailure.key)}`
          : t('customNeedsModels')

  /** Perform the create, returning a failure message or undefined. */
  const createOnce = async (): Promise<string | undefined> => {
    const keyRef = deriveKeyRef(route)
    const storesKey = keyValue.length > 0
    if (!committed) {
      const profile = {
        displayName: displayValue,
        // The profile names the conventional reference only when this card is
        // about to store a key, matching the editor: a route declared with the
        // key left blank keeps its provider-native auth path (a credential
        // chain, ADC) instead of resolving a reference nothing ever sets.
        ...storesKey ? { apiKeyEnv: keyRef } : {},
        api: protocol,
        baseURL: baseURLValue,
        models: models.map(model => ({ ...model })),
      }
      const response = await api.settings.mutate({
        ns: NS,
        ops: [{ op: 'set', path: ['providers', route], value: profile }],
        // `taken` is a snapshot too, so the id check alone cannot see a route
        // declared after this card opened; the revision makes that race a
        // `settings-conflict` instead of a write over the other profile.
        expectedRevision: openedAt,
      })
      if (!response.result.ok) return response.result.error.message
      // The provider now exists. A retry after the key write below fails must
      // not re-run this mutate: the revision it holds is the one this write
      // just superseded, so the Host would answer `settings-conflict` and the
      // key could never be stored from this card at all.
      setCommitted(true)
    }
    if (storesKey) {
      const stored = await api.credentials.set({ ref: keyRef, value: keyValue })
      // The profile landed; saying the key did not is the only honest report,
      // and the retry above now goes straight back to this write.
      if (!stored.result.ok) return stored.result.error.message
    }
    return undefined
  }

  const create = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    try {
      const outcome = await createOnce()
      if (outcome !== undefined) {
        setFailure(outcome)
        return
      }
      props.onClose(true)
    } catch (error) {
      // A transport failure rejects rather than answering; without this the
      // card would stay busy with nothing shown.
      setFailure(messageOf(error))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (committed || props.readOnly || displayValue.length === 0 || models.length > 0
      || keyFailure !== undefined || protocol === '' || !isProbeableUrl(baseURLValue)) return
    const signature = JSON.stringify([baseURLValue, protocol, keyValue])
    if (lastAutomaticProbe.current === signature) return
    lastAutomaticProbe.current = signature
    let active = true
    const timer = globalThis.setTimeout(() => {
      setAutoDiscovering(true)
      setAutoDiscoveryFailure(undefined)
      void api.llm.discoverModels({
        settingsNs: NS,
        baseURL: baseURLValue,
        api: protocol,
        ...keyValue.length === 0 ? {} : { apiKey: keyValue },
      }).then((response) => {
        if (!active) return
        if (!response.result.ok) {
          setAutoDiscoveryFailure(response.result.error.message)
          return
        }
        if (response.result.value.models.length === 0) {
          setAutoDiscoveryFailure(t('fetchEmpty'))
          return
        }
        setModels(response.result.value.models.map(draftFromDiscovered))
      }, (error: unknown) => {
        if (active) setAutoDiscoveryFailure(messageOf(error))
      }).finally(() => {
        if (active) setAutoDiscovering(false)
      })
    }, AUTO_DISCOVERY_DELAY_MS)
    return () => {
      active = false
      globalThis.clearTimeout(timer)
    }
  }, [api.llm, baseURLValue, committed, displayValue, keyFailure, keyValue, models.length, props.readOnly, protocol, t])

  return (
    <div className={styles['editor']}>
      <div className={styles['editorHeader']}>
        <span className={styles['editorTitle']}>{t('customTitle')}</span>
      </div>
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('customDisplayName')}</span>
        <input
          className={styles['input']}
          type="text"
          value={displayName}
          placeholder="Acme Gateway"
          aria-label={t('customDisplayName')}
          disabled={profileDisabled}
          onChange={(event) => { setDisplayName(event.target.value) }}
        />
      </div>
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('baseUrl')}</span>
        <input
          className={styles['input']}
          type="text"
          value={baseURL}
          placeholder="https://gateway.example/v1"
          aria-label={t('baseUrl')}
          disabled={profileDisabled}
          onChange={(event) => { setBaseURL(event.target.value) }}
        />
      </div>
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('customApi')}</span>
        <select
          className={`${styles['input']} ${styles['selectInput']}`}
          value={protocol}
          aria-label={t('customApi')}
          disabled={profileDisabled}
          onChange={(event) => { setProtocol(event.target.value) }}
        >
          {protocols.map(choice => <option key={choice} value={choice}>{choice}</option>)}
        </select>
      </div>
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('keyInput')}</span>
        <input
          className={styles['input']}
          type="password"
          autoComplete="off"
          value={keyDraft}
          placeholder={t('keyPlaceholder')}
          aria-label={t('keyInput')}
          disabled={disabled}
          onChange={(event) => { setKeyDraft(event.target.value) }}
        />
        {/* A create card has no stored key to keep, so the blank case says
            what a blank field means here instead: this route may authenticate
            through the provider's own ambient discovery or OAuth. */}
        {keyFailure === undefined
          ? null
          : <p className={styles['error']}>{t(keyFailure === 'keyBlank' ? 'keyBlankNew' : keyFailure)}</p>}
      </div>
      <ModelListEditor
        models={models}
        onChange={setModels}
        probe={{
          settingsNs: NS,
          baseURL: baseURLValue,
          api: protocol,
          ...keyValue.length === 0 ? {} : { apiKey: keyValue },
        }}
        probeBlocked={keyFailure === 'keyBlank' ? 'keyBlankNew' : keyFailure}
        api={api}
        t={t}
        disabled={profileDisabled || autoDiscovering}
      />
      {autoDiscovering ? <p className={styles['advancedHint']}>{t('customDiscoveringModels')}</p> : null}
      {autoDiscoveryFailure !== undefined ? <p className={styles['error']}>{autoDiscoveryFailure}</p> : null}
      {failure !== undefined ? <p className={styles['error']}>{failure}</p> : null}
      {/* Only the gates with something to say render; a complete card stays visually quiet. */}
      {hint === undefined ? null : <p className={styles['advancedHint']}>{hint}</p>}
      <EditorFooter
        t={t}
        busy={busy}
        submitDisabled={disabled || !ready}
        submitLabel="create"
        submitBusyLabel="creating"
        onCancel={() => { props.onClose(committed) }}
        onSubmit={() => { void create() }}
      />
    </div>
  )
}
