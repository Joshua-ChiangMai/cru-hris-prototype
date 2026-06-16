import type {
  ReportFilterPayload,
  ReportQueryRequest,
} from "@/lib/reports/types";

export type ReportBuilderFormState = {
  gender: string;
  cityId: string;
  maritalStatus: string;
  department: string;
  trainingCompleted: string;
};

export const EMPTY_REPORT_BUILDER_FORM: ReportBuilderFormState = {
  gender: "",
  cityId: "",
  maritalStatus: "",
  department: "",
  trainingCompleted: "",
};

export function buildReportQueryRequest(
  form: ReportBuilderFormState
): ReportQueryRequest {
  const filters: ReportFilterPayload[] = [];

  if (form.gender) {
    filters.push({ field: "gender", value: form.gender });
  }

  if (form.cityId) {
    filters.push({ field: "city", value: form.cityId });
  }

  if (form.maritalStatus) {
    filters.push({ field: "maritalStatus", value: form.maritalStatus });
  }

  if (form.department) {
    filters.push({ field: "department", value: form.department });
  }

  if (form.trainingCompleted === "true" || form.trainingCompleted === "false") {
    filters.push({
      field: "trainingCompleted",
      value: form.trainingCompleted === "true",
    });
  }

  return { filters };
}
