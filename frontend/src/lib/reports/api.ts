import { authFetch } from "@/lib/auth/api";
import { getAccessTokenFromCookie } from "@/lib/auth/session";
import type {
  DashboardSummary,
  EmployeeReportFilters,
  PaginatedReportEmployees,
  ReportDepartmentsResponse,
  ReportExportFormat,
  ReportQueryRequest,
  ReportQueryResponse,
  ReportStatistics,
} from "@/lib/reports/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

function toQueryString(params: EmployeeReportFilters): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.cityId) search.set("cityId", params.cityId);
  if (params.employmentStatus) {
    search.set("employmentStatus", params.employmentStatus);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
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
      // ignore
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function fetchDashboard(): Promise<DashboardSummary> {
  const response = await authFetch("/reports/dashboard");
  return parseJson<DashboardSummary>(response);
}

export async function fetchReportStatistics(
  filters: Pick<EmployeeReportFilters, "cityId"> = {}
): Promise<ReportStatistics> {
  const qs = filters.cityId ? `?cityId=${filters.cityId}` : "";
  const response = await authFetch(`/reports/statistics${qs}`);
  return parseJson<ReportStatistics>(response);
}

export async function fetchReportDepartments(): Promise<ReportDepartmentsResponse> {
  const response = await authFetch("/reports/departments");
  return parseJson<ReportDepartmentsResponse>(response);
}

export async function queryReport(
  payload: ReportQueryRequest
): Promise<ReportQueryResponse> {
  const response = await authFetch("/reports/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<ReportQueryResponse>(response);
}

export async function downloadReportQueryExport(
  payload: ReportQueryRequest,
  format: ReportExportFormat
): Promise<void> {
  const token = getAccessTokenFromCookie();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE}/reports/query/export`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, format }),
  });

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
      // export errors may be plain text
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const filenameMatch = disposition?.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? `HRIS_Report.${format}`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function fetchReportEmployees(
  params: EmployeeReportFilters
): Promise<PaginatedReportEmployees> {
  const response = await authFetch(
    `/reports/employees${toQueryString(params)}`
  );
  return parseJson<PaginatedReportEmployees>(response);
}

export async function downloadEmployeeReportCsv(
  filters: Omit<EmployeeReportFilters, "page" | "limit">
): Promise<void> {
  const token = getAccessTokenFromCookie();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${API_BASE}/reports/employees/export${toQueryString(filters)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

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
      // CSV error bodies may be plain text
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const filenameMatch = disposition?.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? "employees.csv";

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
