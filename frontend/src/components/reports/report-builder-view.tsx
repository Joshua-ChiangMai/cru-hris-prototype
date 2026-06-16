"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { usePermission } from "@/hooks/use-permission";
import { fetchEmployeeCities } from "@/lib/employees/api";
import type { CitySummary } from "@/lib/employees/types";
import { PERMISSIONS } from "@/lib/rbac";
import {
  downloadReportQueryExport,
  fetchReportDepartments,
  queryReport,
} from "@/lib/reports/api";
import {
  buildReportQueryRequest,
  EMPTY_REPORT_BUILDER_FORM,
  type ReportBuilderFormState,
} from "@/lib/reports/build-filters";
import type {
  Gender,
  MaritalStatus,
  ReportQueryEmployee,
  ReportQueryResponse,
  ReportQuerySummaries,
} from "@/lib/reports/types";

const SELECT_CLASS =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

const GENDER_OPTIONS: Array<{ value: Gender | ""; label: string }> = [
  { value: "", label: "Any gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

const MARITAL_OPTIONS: Array<{ value: MaritalStatus | ""; label: string }> = [
  { value: "", label: "Any marital status" },
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "DOMESTIC_PARTNERSHIP", label: "Domestic partnership" },
];

const TRAINING_COMPLETED_OPTIONS = [
  { value: "", label: "Any training completion" },
  { value: "true", label: "Has completed training" },
  { value: "false", label: "No completed training" },
];

function formatEnumLabel(value: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toTableRows(employees: ReportQueryEmployee[]): string[][] {
  return employees.map((row) => [
    row.employeeNo,
    row.fullName,
    row.city.name,
    row.department ?? "—",
    formatEnumLabel(row.gender),
    formatEnumLabel(row.maritalStatus),
  ]);
}

function ReportSummariesPanel({
  total,
  summaries,
}: {
  total: number;
  summaries: ReportQuerySummaries;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs text-muted">Matching employees</p>
          <p className="mt-1 text-2xl font-semibold">{total}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Cities represented</p>
          <p className="mt-1 text-2xl font-semibold">{summaries.byCity.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Gender groups</p>
          <p className="mt-1 text-2xl font-semibold">
            {summaries.byGender.length}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Training assignments</p>
          <p className="mt-1 text-2xl font-semibold">
            {summaries.trainingCompletion.reduce(
              (sum, row) => sum + row.count,
              0
            )}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Married employee families</p>
          <p className="mt-1 text-2xl font-semibold">
            {summaries.marriedEmployeeFamilies}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-base font-medium">Employees by gender</h3>
          {summaries.byGender.length > 0 ? (
            <DataTable
              headers={["Gender", "Count"]}
              rows={summaries.byGender.map((row) => [
                row.label,
                String(row.count),
              ])}
            />
          ) : (
            <p className="text-sm text-muted">No data</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-medium">Employees by city</h3>
          {summaries.byCity.length > 0 ? (
            <DataTable
              headers={["City", "Code", "Count"]}
              rows={summaries.byCity.map((row) => [
                row.cityName,
                row.cityCode,
                String(row.count),
              ])}
            />
          ) : (
            <p className="text-sm text-muted">No data</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-medium">
            Employees by marital status
          </h3>
          {summaries.byMaritalStatus.length > 0 ? (
            <DataTable
              headers={["Marital status", "Count"]}
              rows={summaries.byMaritalStatus.map((row) => [
                row.label,
                String(row.count),
              ])}
            />
          ) : (
            <p className="text-sm text-muted">No data</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-medium">
            Training completion statistics
          </h3>
          {summaries.trainingCompletion.length > 0 ? (
            <DataTable
              headers={["Status", "Assignments"]}
              rows={summaries.trainingCompletion.map((row) => [
                row.label,
                String(row.count),
              ])}
            />
          ) : (
            <p className="text-sm text-muted">No training assignments</p>
          )}
        </Card>
      </div>
    </section>
  );
}

export function ReportBuilderView() {
  const canExport = usePermission(PERMISSIONS.reportExport);
  const [cities, setCities] = useState<CitySummary[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [form, setForm] = useState<ReportBuilderFormState>(
    EMPTY_REPORT_BUILDER_FORM
  );
  const [result, setResult] = useState<ReportQueryResponse | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runReport = useCallback(async (activeForm: ReportBuilderFormState) => {
    setLoading(true);
    setError(null);
    try {
      const response = await queryReport(buildReportQueryRequest(activeForm));
      setResult(response);
      setHasRun(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run report");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      fetchEmployeeCities(),
      fetchReportDepartments(),
    ])
      .then(([cityRows, departmentRows]) => {
        setCities(cityRows);
        setDepartments(departmentRows.data);
      })
      .catch(() => {
        setCities([]);
        setDepartments([]);
      });
  }, []);

  useEffect(() => {
    void runReport(EMPTY_REPORT_BUILDER_FORM);
  }, [runReport]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runReport(form);
  }

  function handleReset() {
    setForm(EMPTY_REPORT_BUILDER_FORM);
    void runReport(EMPTY_REPORT_BUILDER_FORM);
    setError(null);
  }

  const canExportResults =
    canExport && hasRun && result !== null && result.total > 0;

  async function handleExport(format: "csv" | "xlsx") {
    setExporting(format);
    setError(null);
    try {
      await downloadReportQueryExport(buildReportQueryRequest(form), format);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Report Builder</h1>
          <p className="text-sm text-muted">
            Filter your scoped workforce and review dashboard-style summaries for
            demos.
          </p>
        </div>
        <Link
          href="/reports/overview"
          className="text-sm text-primary hover:underline"
        >
          Operational reports
        </Link>
      </header>

      {error && (
        <p className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <Card className="space-y-4">
        <h2 className="text-base font-medium">Filters</h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted">Gender</span>
              <select
                className={SELECT_CLASS}
                value={form.gender}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gender: e.target.value }))
                }
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value || "any"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted">City</span>
              <select
                className={SELECT_CLASS}
                value={form.cityId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cityId: e.target.value }))
                }
              >
                <option value="">All cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted">
                Marital status
              </span>
              <select
                className={SELECT_CLASS}
                value={form.maritalStatus}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    maritalStatus: e.target.value,
                  }))
                }
              >
                {MARITAL_OPTIONS.map((opt) => (
                  <option key={opt.value || "any"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted">Department</span>
              <select
                className={SELECT_CLASS}
                value={form.department}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted">
                Training completed
              </span>
              <select
                className={SELECT_CLASS}
                value={form.trainingCompleted}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    trainingCompleted: e.target.value,
                  }))
                }
              >
                {TRAINING_COMPLETED_OPTIONS.map((opt) => (
                  <option key={opt.value || "any"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Running…" : "Run report"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleReset}
            >
              Clear filters
            </Button>
          </div>
        </form>
      </Card>

      {hasRun && result ? (
        <ReportSummariesPanel
          total={result.total}
          summaries={result.summaries}
        />
      ) : null}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-medium">Employee results</h2>
          <div className="flex flex-wrap items-center gap-3">
            {hasRun && result && (
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">
                  {result.total}
                </span>{" "}
                {result.total === 1 ? "employee" : "employees"} found
              </p>
            )}
            {canExport && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={!canExportResults || exporting !== null}
                  onClick={() => void handleExport("csv")}
                >
                  {exporting === "csv" ? "Exporting…" : "Export CSV"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={!canExportResults || exporting !== null}
                  onClick={() => void handleExport("xlsx")}
                >
                  {exporting === "xlsx" ? "Exporting…" : "Export Excel"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading results…</p>
        ) : !hasRun ? (
          <p className="text-sm text-muted">
            Set filters and run the report to see matching employees.
          </p>
        ) : result && result.employees.length > 0 ? (
          <DataTable
            headers={[
              "Employee ID",
              "Name",
              "City",
              "Department",
              "Gender",
              "Marital Status",
            ]}
            rows={toTableRows(result.employees)}
          />
        ) : (
          <p className="text-sm text-muted">
            No employees match the selected filters.
          </p>
        )}
      </Card>
    </div>
  );
}
