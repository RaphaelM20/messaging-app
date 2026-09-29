import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL && import.meta.env.DEV) {
  console.warn("VITE_API_URL is not set. Copy .env.example to .env.");
}

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    // Human-readable message supplied by the server, if any.
    this.detail = detail;
  }
}

let handleUnauthorized = null;

// Registered by AuthProvider so a rejected token logs the user out.
export function setUnauthorizedHandler(handler) {
  handleUnauthorized = handler;
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorDetail(body) {
  const first = body?.errors?.[0];
  if (!first) return null;
  // express-validator reports `msg`; hand-written errors use `message`.
  if (first.msg === "Invalid value" && first.path) {
    return `Invalid ${first.path}`;
  }
  return first.msg ?? first.message ?? null;
}

export async function apiFetch(path, { method = "GET", body, signal } = {}) {
  const token = getToken();
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const data = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401 && token) handleUnauthorized?.();
    throw new ApiError(response.status, getErrorDetail(data));
  }
  return data;
}

export function isAbortError(err) {
  return err?.name === "AbortError";
}
