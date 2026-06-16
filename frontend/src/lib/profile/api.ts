import { authFetch } from "@/lib/auth/api";
import type { ProfileResponse, UpdateProfilePayload } from "./types";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | undefined;
    try {
      const body = (await response.json()) as {
        message?: string | { message?: string; code?: string };
        code?: string;
      };
      if (typeof body.message === "object" && body.message) {
        message = body.message.message ?? message;
        code = body.message.code ?? body.code;
      } else if (typeof body.message === "string") {
        message = body.message;
        code = body.code;
      }
    } catch {
      // ignore
    }
    const err = new Error(message) as Error & { code?: string };
    err.code = code;
    throw err;
  }
  return response.json() as Promise<T>;
}

export async function fetchEmployeeProfile(
  employeeId: string,
): Promise<ProfileResponse> {
  const response = await authFetch(`/employees/${employeeId}/profile`);
  return parseJson<ProfileResponse>(response);
}

export async function fetchMyProfile(): Promise<ProfileResponse> {
  const response = await authFetch("/employees/me/profile");
  return parseJson<ProfileResponse>(response);
}

export async function updateEmployeeProfile(
  employeeId: string,
  payload: UpdateProfilePayload,
): Promise<ProfileResponse> {
  const response = await authFetch(`/employees/${employeeId}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<ProfileResponse>(response);
}

export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<ProfileResponse> {
  const response = await authFetch("/employees/me/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<ProfileResponse>(response);
}

export async function submitProfileUpdateRequest(
  targetEmployeeId: string,
  profile: UpdateProfilePayload,
  comment?: string,
): Promise<void> {
  const response = await authFetch("/approval/requests/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetEmployeeId, profile, comment }),
  });
  await parseJson(response);
}

export function isProfileApprovalRequired(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const coded = error as Error & { code?: string };
  return (
    coded.code === "APPROVAL_REQUIRED" ||
    coded.code === "PROFILE_APPROVAL_REQUIRED" ||
    error.message.includes("APPROVAL_REQUIRED") ||
    error.message.toLowerCase().includes("require approval")
  );
}
