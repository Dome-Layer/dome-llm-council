import { authHeaders } from "@/lib/auth";
import type { VerdictPayload } from "@/types/sse";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";

export class APIError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.detail ?? data.message ?? msg;
    } catch {}
    throw new APIError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────

export async function requestMagicLink(payload: { email: string }): Promise<void> {
  await request<void>("POST", "/auth/magic-link", payload);
}

export async function deleteSession(): Promise<void> {
  await request<void>("DELETE", "/auth/session");
}

// ─── Saved deliberations ──────────────────────────────────────────

export interface DeliberationSummary {
  id: string;
  deliberation_id: string;
  question: string;
  verdict_summary: string;
  consensus_confidence: number;
  saved_at: string;
  label: string | null;
  full_payload: VerdictPayload | null;
}

export async function listDeliberations(): Promise<{ deliberations: DeliberationSummary[] }> {
  return request("GET", "/deliberations");
}

export async function saveDeliberation(
  deliberationId: string,
  payload: { question: string; verdict_summary: string; consensus_confidence: number; label?: string; full_payload?: VerdictPayload },
): Promise<{ saved: boolean; saved_at: string }> {
  return request("POST", `/deliberations/${deliberationId}/save`, payload);
}

export async function deleteDeliberation(id: string): Promise<void> {
  await request<void>("DELETE", `/deliberations/${id}`);
}
