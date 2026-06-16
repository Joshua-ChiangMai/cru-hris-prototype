import { authFetch } from "@/lib/auth/api";
import type {
  EmployeeTrainingsResponse,
  TrainingsResponse,
} from "@/lib/training/types";

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

export async function fetchTrainings(): Promise<TrainingsResponse> {
  const response = await authFetch("/trainings");
  return parseJson<TrainingsResponse>(response);
}

export async function fetchEmployeeTrainings(
  employeeId: string
): Promise<EmployeeTrainingsResponse> {
  const response = await authFetch(`/employees/${employeeId}/trainings`);
  return parseJson<EmployeeTrainingsResponse>(response);
}

export async function fetchMyTrainings(): Promise<EmployeeTrainingsResponse> {
  const response = await authFetch("/employees/me/trainings");
  return parseJson<EmployeeTrainingsResponse>(response);
}
