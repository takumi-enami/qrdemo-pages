import type { Env } from './env'

export type PrintGatewayPayload = {
  qr10: File
  title20: string
  qr30: string
  copies?: number
}

export type PrintGatewayResult = {
  ok: boolean
  url: string
  status?: number
  text?: string
  payload?: unknown
  error?: string
}

function normalizeGatewayBase(env: Env): string | null {
  const raw = typeof env.PRINT_GATEWAY_URL === 'string' ? env.PRINT_GATEWAY_URL.trim() : ''
  if (!raw) return null
  return raw.replace(/\/+$/, '')
}

function buildGatewayUrl(env: Env, path: string): string | null {
  const base = normalizeGatewayBase(env)
  if (!base) return null
  const trimmed = path.startsWith('/') ? path : `/${path}`
  return `${base}${trimmed}`
}

function buildGatewayHeaders(env: Env): Headers {
  const headers = new Headers()
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID)
    headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET)
  }
  return headers
}

function tryParseJson(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function forwardPrintGateway(env: Env, payload: PrintGatewayPayload): Promise<PrintGatewayResult> {
  const url = buildGatewayUrl(env, '/print')
  if (!url) {
    return { ok: false, url: '', error: 'PRINT_GATEWAY_URL is not set.' }
  }

  const form = new FormData()
  form.append('qr10', payload.qr10)
  form.append('title20', payload.title20)
  form.append('qr30', payload.qr30)
  if (payload.copies != null) {
    form.append('copies', String(payload.copies))
  }

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: buildGatewayHeaders(env),
      body: form,
    })
    const text = await resp.text()
    const json = tryParseJson(text)
    const ok = resp.ok && (json as any)?.ok === true
    if (ok) {
      return { ok: true, url, status: resp.status, text, payload: json }
    }
    return { ok: false, url, status: resp.status, text, payload: json }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Print gateway request failed.'
    return { ok: false, url, error: message }
  }
}

export async function probePrintGateway(env: Env): Promise<PrintGatewayResult> {
  const url = buildGatewayUrl(env, '/health')
  if (!url) {
    return { ok: false, url: '', error: 'PRINT_GATEWAY_URL is not set.' }
  }

  try {
    const resp = await fetch(url, { method: 'GET', headers: buildGatewayHeaders(env) })
    const text = await resp.text()
    return { ok: resp.ok, url, status: resp.status, text }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Print gateway request failed.'
    return { ok: false, url, error: message }
  }
}
