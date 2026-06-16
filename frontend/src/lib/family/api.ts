import { authFetch } from "@/lib/auth/api";
import type {
  FamilyDetail,
  ListFamiliesParams,
  PaginatedFamilies,
} from "./types";

function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    return response.json().then((body) => {
      const message =
        typeof body?.message === "string"
          ? body.message
          : Array.isArray(body?.message)
            ? body.message.join(", ")
            : `Request failed (${response.status})`;
      throw new Error(message);
    });
  }
  return response.json() as Promise<T>;
}

export async function fetchFamilies(
  params: ListFamiliesParams = {},
): Promise<PaginatedFamilies> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  const qs = search.toString();
  const response = await authFetch(`/families${qs ? `?${qs}` : ""}`);
  return parseJson<PaginatedFamilies>(response);
}

export async function fetchMyFamily(): Promise<FamilyDetail> {
  const response = await authFetch("/families/me");
  const body = await parseJson<{ data: FamilyDetail }>(response);
  return body.data;
}

export async function fetchFamilyById(id: string): Promise<FamilyDetail> {
  const response = await authFetch(`/families/${id}`);
  const body = await parseJson<{ data: FamilyDetail }>(response);
  return body.data;
}
