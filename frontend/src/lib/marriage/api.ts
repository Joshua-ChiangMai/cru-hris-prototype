import { authFetch } from "@/lib/auth/api";
import type {
  EligibleSpousesResponse,
  ListMarriageRequestsParams,
  MarriageRequestResponse,
  PaginatedMarriageRequests,
} from "@/lib/marriage/types";

function toQuery(params: ListMarriageRequestsParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.status) search.set("status", params.status);
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
      };
      if (Array.isArray(body.message)) {
        message = body.message.join(", ");
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function fetchMyMarriageRequests(
  params: ListMarriageRequestsParams = {},
): Promise<PaginatedMarriageRequests> {
  const response = await authFetch(`/marriage/requests/me${toQuery(params)}`);
  return parseJson<PaginatedMarriageRequests>(response);
}

export async function fetchMarriageApprovalQueue(
  params: ListMarriageRequestsParams = {},
): Promise<PaginatedMarriageRequests> {
  const response = await authFetch(`/marriage/requests/queue${toQuery(params)}`);
  return parseJson<PaginatedMarriageRequests>(response);
}

export async function fetchEligibleSpouses(
  search?: string,
): Promise<EligibleSpousesResponse> {
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const response = await authFetch(`/marriage/eligible-spouses${qs}`);
  return parseJson<EligibleSpousesResponse>(response);
}

export async function submitMarriageRequest(
  spouseEmployeeId: string,
): Promise<MarriageRequestResponse> {
  const response = await authFetch("/marriage/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spouseEmployeeId }),
  });
  return parseJson<MarriageRequestResponse>(response);
}

export async function approveMarriageRequest(
  id: string,
): Promise<MarriageRequestResponse> {
  const response = await authFetch(`/marriage/requests/${id}/approve`, {
    method: "POST",
  });
  return parseJson<MarriageRequestResponse>(response);
}

export async function rejectMarriageRequest(
  id: string,
  rejectionReason: string,
): Promise<MarriageRequestResponse> {
  const response = await authFetch(`/marriage/requests/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rejectionReason }),
  });
  return parseJson<MarriageRequestResponse>(response);
}

export async function cancelMarriageRequest(
  id: string,
): Promise<MarriageRequestResponse> {
  const response = await authFetch(`/marriage/requests/${id}/cancel`, {
    method: "POST",
  });
  return parseJson<MarriageRequestResponse>(response);
}
