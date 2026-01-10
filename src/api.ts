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

export type StepActionBody = {
  station_id?: string | null;
  note?: string | null;
  meta?: Record<string, unknown>;
  expected_version: number;
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

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
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
      parts.push(`body: ${JSON.stringify(err.body)}`);
    }
    return parts.filter(Boolean).join("\n");
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, credentials: "include" });
  const body = await readJson(res);

  if (!res.ok) {
    throw new ApiRequestError(`HTTP ${res.status}`, res.status, body);
  }
  if (!isApiResp(body)) {
    throw new ApiRequestError("Unexpected API response", res.status, body);
  }
  if (!body.ok) {
    throw new ApiRequestError(`${body.error.code}: ${body.error.message}`, res.status, body);
  }
  return body.data as T;
}

export async function ensureToken(): Promise<void> {
  const res = await fetch("/api/token", { method: "POST", credentials: "include" });
  const body = await readJson(res);

  if (!res.ok) {
    throw new ApiRequestError(`HTTP ${res.status}`, res.status, body);
  }
  if (!body || typeof body !== "object" || !("ok" in body)) {
    throw new ApiRequestError("Unexpected token response", res.status, body);
  }
  const ok = (body as { ok?: unknown }).ok;
  if (ok === false) {
    const err = (body as ApiErr).error;
    throw new ApiRequestError(`${err.code}: ${err.message}`, res.status, body);
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

export async function advanceSample(id: string, body: StepActionBody): Promise<Sample> {
  await ensureToken();
  const data = await apiFetch<SampleRow>(`/api/samples/${id}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapSample(data);
}

export async function rollbackSample(id: string, body: StepActionBody): Promise<Sample> {
  await ensureToken();
  const data = await apiFetch<SampleRow>(`/api/samples/${id}/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return mapSample(data);
}
