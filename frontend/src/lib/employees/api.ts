import { authFetch } from "@/lib/auth/api";
import type {
  CitySummary,
  EmployeeDetail,
  EmployeeListParams,
  PaginatedEmployees,
  UpdateEmployeePayload,
} from "@/lib/employees/types";

function toQueryString(params: EmployeeListParams): string {
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

export async function fetchEmployees(
  params: EmployeeListParams
): Promise<PaginatedEmployees> {
  const response = await authFetch(`/employees${toQueryString(params)}`);
  return parseJson<PaginatedEmployees>(response);
}

export async function fetchEmployeeCities(): Promise<CitySummary[]> {
  const response = await authFetch("/employees/cities");
  return parseJson<CitySummary[]>(response);
}

export async function fetchEmployeeMe(): Promise<EmployeeDetail> {
  const response = await authFetch("/employees/me");
  return parseJson<EmployeeDetail>(response);
}

export async function fetchEmployeeById(id: string): Promise<EmployeeDetail> {
  const response = await authFetch(`/employees/${id}`);
  return parseJson<EmployeeDetail>(response);
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<EmployeeDetail> {
  const response = await authFetch(`/employees/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<EmployeeDetail>(response);
}
