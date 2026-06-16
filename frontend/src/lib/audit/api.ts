import { authFetch } from "@/lib/auth/api";
import type {
  AuditFilterOptions,
  ListAuditLogsParams,
  PaginatedAuditLogs,
} from "@/lib/audit/types";

function toQuery(params: ListAuditLogsParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.actorUserId) search.set("actorUserId", params.actorUserId);
  if (params.action) search.set("action", params.action);
  if (params.entity) search.set("entity", params.entity);
  if (params.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params.dateTo) search.set("dateTo", params.dateTo);
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

export async function fetchAuditLogs(
  params: ListAuditLogsParams = {},
): Promise<PaginatedAuditLogs> {
  const response = await authFetch(`/audit/logs${toQuery(params)}`);
  return parseJson<PaginatedAuditLogs>(response);
}

export async function fetchAuditFilterOptions(): Promise<AuditFilterOptions> {
  const response = await authFetch("/audit/logs/filters");
  const body = await parseJson<{ data: AuditFilterOptions }>(response);
  return body.data;
}
