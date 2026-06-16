import { authFetch } from "@/lib/auth/api";
import type {
  ListApprovalParams,
  PaginatedUpdateRequests,
  UpdateRequest,
} from "@/lib/approval/types";

function toQuery(params: ListApprovalParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);
  if (params.cityId) search.set("cityId", params.cityId);
  if (params.changeDomain) search.set("changeDomain", params.changeDomain);
  if (params.history) search.set("history", "true");
  if (params.pendingOnly) search.set("pendingOnly", "true");
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as {
        message?: string | string[];
        code?: string;
      };
      if (Array.isArray(body.message)) {
        message = body.message.join(", ");
      } else if (body.message) {
        message = typeof body.message === "string" ? body.message : message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function fetchApprovalRequests(
  params: ListApprovalParams
): Promise<PaginatedUpdateRequests> {
  const response = await authFetch(`/approval/requests${toQuery(params)}`);
  return parseJson<PaginatedUpdateRequests>(response);
}

export async function fetchApprovalRequest(id: string): Promise<UpdateRequest> {
  const response = await authFetch(`/approval/requests/${id}`);
  return parseJson<UpdateRequest>(response);
}

export async function submitProfileUpdateRequest(
  targetEmployeeId: string,
  profile: Record<string, unknown>,
  comment?: string,
): Promise<UpdateRequest> {
  const response = await authFetch("/approval/requests/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetEmployeeId, profile, comment }),
  });
  return parseJson<UpdateRequest>(response);
}

export async function submitFamilyUpdateRequest(
  targetEmployeeId: string,
  family: {
    displayName: string;
    members: Array<{
      relationshipType: string;
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
    }>;
  },
  comment?: string,
): Promise<UpdateRequest> {
  const response = await authFetch("/approval/requests/family", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetEmployeeId, family, comment }),
  });
  return parseJson<UpdateRequest>(response);
}

export async function submitSensitiveUpdateRequest(
  targetEmployeeId: string,
  changes: Record<string, unknown>,
  comment?: string
): Promise<UpdateRequest> {
  const response = await authFetch("/approval/requests/sensitive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetEmployeeId, changes, comment }),
  });
  return parseJson<UpdateRequest>(response);
}

export async function approveRequest(
  id: string,
  comment?: string
): Promise<UpdateRequest> {
  const response = await authFetch(`/approval/requests/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  return parseJson<UpdateRequest>(response);
}

export async function rejectRequest(
  id: string,
  comment: string
): Promise<UpdateRequest> {
  const response = await authFetch(`/approval/requests/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  return parseJson<UpdateRequest>(response);
}

export async function cancelRequest(
  id: string,
  comment?: string
): Promise<UpdateRequest> {
  const response = await authFetch(`/approval/requests/${id}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  return parseJson<UpdateRequest>(response);
}
