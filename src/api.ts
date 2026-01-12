import { renderQrPngBlob } from "./qr";

export type StepCode = "RECEIVE" | "PREP" | "WEIGH" | "ANALYZE" | "REPORT" | "CERTIFY";

export type SampleRow = {
  id: string;
  sample_code: string;
  title: string | null;
  current_step: StepCode;
  updated_at: string | null;
  locked: boolean | null;
  version: number;
};

export type Station = {
  id: string;
  station_code: string;
  name: string;
  step: StepCode;
  is_active: boolean;
};

export type Sample = {
  id: string;
  code: string;
  title: string | null;
  current_step: StepCode;
  updated_at: string | null;
  locked: boolean | null;
  version: number;
};

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string; details?: unknown } };
export type ApiResp<T> = ApiOk<T> | ApiErr;
type ApiTransitionOk = { ok: true; sample: SampleRow; event?: unknown };

export type StepActionBody = {
  station_id?: string | null;
  note?: string;
  meta?: Record<string, unknown>;
  expected_version: number;
};

export type CreateSampleBody = {
  sample_code: string;
  title?: string | null;
  existing_uuid?: string | null;
  id_uuid?: string | null;
  uuid?: string | null;
};

export type PrintResult = {
  sample: Sample;
  printed: boolean;
  print_error: string | null;
};

type PrintResultRow = {
  sample: SampleRow;
  printed: boolean;
  print_error: string | null;
};

type PrintPayload = {
  qrText: string;
  title: string;
  copies?: number;
};

export class ApiRequestError extends Error {
  status?: number;
  body?: unknown;

  constructor(message: string, status?: number, body?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

function isApiResp(value: unknown): value is ApiResp<unknown> {
  if (!value || typeof value !== "object") return false;
  const v = value as { ok?: unknown; data?: unknown; error?: unknown };
  if (v.ok === true) return "data" in v;
  if (v.ok === false) return "error" in v;
  return false;
}

async function readBody(res: Response): Promise<{ json: unknown | null; text: string }> {
  const text = await res.text();
  if (!text) return { json: null, text: "" };
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

function mapSample(row: SampleRow): Sample {
  return {
    id: row.id,
    code: row.sample_code,
    title: row.title,
    current_step: row.current_step,
    updated_at: row.updated_at,
    locked: row.locked,
    version: row.version,
  };
}

export function formatApiError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    const parts = [err.message, err.status != null ? `status: ${err.status}` : null];
    if (err.body != null) {
      const bodyText = typeof err.body === "string" ? err.body : JSON.stringify(err.body);
      parts.push(`body: ${bodyText}`);
    }
    return parts.filter(Boolean).join("\n");
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, credentials: "include" });
  const { json, text } = await readBody(res);
  const body = json ?? (text ? text : null);

  if (!res.ok) {
    throw new ApiRequestError(`HTTP ${res.status}`, res.status, body);
  }
  if (!json || !isApiResp(json)) {
    throw new ApiRequestError("Unexpected API response", res.status, body);
  }
  if (!json.ok) {
    throw new ApiRequestError(`${json.error.code}: ${json.error.message}`, res.status, json);
  }
  return json.data as T;
}

async function apiFetchTransition(path: string, init: RequestInit): Promise<SampleRow> {
  const res = await fetch(path, { ...init, credentials: "include" });
  const { json, text } = await readBody(res);
  const body = json ?? (text ? text : null);

  if (!res.ok) {
    throw new ApiRequestError(`HTTP ${res.status}`, res.status, body);
  }
  if (!json || typeof json !== "object" || !("ok" in json)) {
    throw new ApiRequestError("Unexpected API response", res.status, body);
  }
  const ok = (json as { ok?: unknown }).ok;
  if (ok === false) {
    const err = (json as ApiErr).error;
    throw new ApiRequestError(`${err.code}: ${err.message}`, res.status, json);
  }
  const payload = json as ApiTransitionOk;
  if (!payload.sample) {
    throw new ApiRequestError("Unexpected API response", res.status, json);
  }
  return payload.sample;
}

export async function ensureToken(): Promise<void> {
  const res = await fetch("/api/token", { method: "POST", credentials: "include" });
  const { json, text } = await readBody(res);
  const body = json ?? (text ? text : null);

  if (!res.ok) {
    throw new ApiRequestError(`HTTP ${res.status}`, res.status, body);
  }
  if (!json || typeof json !== "object" || !("ok" in json)) {
    throw new ApiRequestError("Unexpected token response", res.status, body);
  }
  const ok = (json as { ok?: unknown }).ok;
  if (ok === false) {
    const err = (json as ApiErr).error;
    throw new ApiRequestError(`${err.code}: ${err.message}`, res.status, json);
  }
  if (ok !== true) {
    throw new ApiRequestError("Unexpected token response", res.status, body);
  }
}

export async function getSamples(params: { limit?: number; step?: StepCode } = {}): Promise<Sample[]> {
  await ensureToken();
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.step) qs.set("step", params.step);
  const url = qs.toString() ? `/api/samples?${qs.toString()}` : "/api/samples";
  const rows = await apiFetch<SampleRow[]>(url, { method: "GET" });
  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows.map(mapSample);
}

export async function getStations(step?: StepCode): Promise<Station[]> {
  await ensureToken();
  const qs = new URLSearchParams();
  if (step) qs.set("step", step);
  const url = qs.toString() ? `/api/stations?${qs.toString()}` : "/api/stations";
  const rows = await apiFetch<Station[]>(url, { method: "GET" });
  return Array.isArray(rows) ? rows : [];
}

export async function createSample(body: CreateSampleBody): Promise<PrintResult> {
  await ensureToken();
  const data = await apiFetch<PrintResultRow>("/api/samples", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    sample: mapSample(data.sample),
    printed: data.printed,
    print_error: data.print_error ?? null,
  };
}

export async function printSample(id: string): Promise<PrintResult> {
  await ensureToken();
  const data = await apiFetch<PrintResultRow>(`/api/samples/${id}/print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return {
    sample: mapSample(data.sample),
    printed: data.printed,
    print_error: data.print_error ?? null,
  };
}

type PrintProxyResponse = {
  ok: true;
};

export async function printSampleLabel(payload: PrintPayload): Promise<void> {
  await ensureToken();
  const qrBlob = await renderQrPngBlob(payload.qrText, { size: 240, margin: 0 });
  const file = new File([qrBlob], "qr.png", { type: "image/png" });
  const form = new FormData();
  form.append("qr10", file);
  form.append("title20", payload.title);
  form.append("qr30", payload.qrText);
  if (payload.copies != null) {
    form.append("copies", String(payload.copies));
  }

  await apiFetch<PrintProxyResponse>("/api/print", {
    method: "POST",
    body: form,
  });
}

export async function advanceSample(id: string, body: StepActionBody): Promise<Sample> {
  await ensureToken();
  const data = await apiFetchTransition(`/api/samples/${id}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapSample(data);
}

export async function rollbackSample(id: string, body: StepActionBody): Promise<Sample> {
  await ensureToken();
  const data = await apiFetchTransition(`/api/samples/${id}/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapSample(data);
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST", credentials: "include" });
}
