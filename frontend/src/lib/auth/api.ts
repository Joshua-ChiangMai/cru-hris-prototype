import type { LoginResponse, Session } from "@/lib/auth/types";
import {
  clearAuthCookies,
  getAccessTokenFromCookie,
  getRefreshTokenFromCookie,
  setAuthCookies,
} from "@/lib/auth/session";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(", ");
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new AuthApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJson<LoginResponse>(response);
  setAuthCookies(data.accessToken, data.refreshToken, data.expiresIn);
  return data;
}

export async function logout(): Promise<void> {
  const accessToken = getAccessTokenFromCookie();

  if (accessToken) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Best-effort server logout; always clear client session.
    }
  }

  clearAuthCookies();
}

export async function fetchSession(): Promise<Session> {
  const accessToken = getAccessTokenFromCookie();

  if (!accessToken) {
    throw new AuthApiError("Not authenticated", 401);
  }

  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  return parseJson<Session>(response);
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshTokenFromCookie();

  if (!refreshToken) {
    throw new AuthApiError("No refresh token", 401);
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseJson<{ accessToken: string; expiresIn: number }>(
    response
  );

  setAuthCookies(data.accessToken, refreshToken, data.expiresIn);
  return data.accessToken;
}

export async function authFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  let accessToken = getAccessTokenFromCookie();

  if (!accessToken) {
    accessToken = await refreshAccessToken();
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  let response = await fetch(`${API_BASE}${input}`, { ...init, headers });

  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    headers.set("Authorization", `Bearer ${accessToken}`);
    response = await fetch(`${API_BASE}${input}`, { ...init, headers });
  }

  return response;
}
