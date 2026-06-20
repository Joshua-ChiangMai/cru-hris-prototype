"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/table";
import { usePermission } from "@/hooks/use-permission";
import { fetchEmployeeCities } from "@/lib/employees/api";
import type { CitySummary, EmploymentStatus } from "@/lib/employees/types";
import { PERMISSIONS } from "@/lib/rbac";
import {
  downloadEmployeeReportCsv,
  fetchReportEmployees,
  fetchReportStatistics,
} from "@/lib/reports/api";
import type {
  EmployeeReportFilters,
  PaginatedReportEmployees,
  ReportStatistics,
} from "@/lib/reports/types";

const STATUS_OPTIONS: Array<{ value: EmploymentStatus | ""; label: string }> =
  [
    { value: "", label: "All statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "TERMINATED", label: "Terminated" },
  ];

export function ReportsView() {
  const canExport = usePermission(PERMISSIONS.reportExport);
  const [cities, setCities] = useState<CitySummary[]>([]);
  const [stats, setStats] = useState<ReportStatistics | null>(null);
  const [employees, setEmployees] = useState<PaginatedReportEmployees | null>(
    null
  );
  const [filters, setFilters] = useState<EmployeeReportFilters>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (activeFilters: EmployeeReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const [statistics, list] = await Promise.all([
        fetchReportStatistics({ cityId: activeFilters.cityId }),
        fetchReportEmployees(activeFilters),
      ]);
      setStats(statistics);
      setEmployees(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployeeCities()
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    void loadData(filters);
  }, [filters, loadData]);

  function handleFilterSubmit(event: FormEvent) {
    event.preventDefault();
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: searchInput.trim() || undefined,
    }));
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      await downloadEmployeeReportCsv({
        search: filters.search,
        cityId: filters.cityId,
        employmentStatus: filters.employmentStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const employeeRows =
    employees?.data.map((row) => [
      row.employeeNo,
      row.fullName,
      row.city.name,
      row.employmentStatus,
      row.jobTitle ?? "—",
      row.workEmail ?? "—",
    ]) ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Operational Reports</h1>
          <p className="text-sm text-muted">
            Filter employees, view statistics, and export CSV for your scope.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/reports"
            className="text-sm text-primary hover:underline"
          >
            Report Builder
          </Link>
        {canExport && (
          <Button
            variant="outline"
            disabled={exporting || loading}
            onClick={() => void handleExport()}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        )}
        </div>
      </header>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {stats && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-xs text-muted">Total Employees</p>
            <p className="mt-1 text-2xl font-semibold">{stats.totalEmployees}</p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Pending Approvals</p>
            <p className="mt-1 text-2xl font-semibold">
              {stats.approvalByStatus.find((s) => s.status === "PENDING")
                ?.count ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Active</p>
            <p className="mt-1 text-2xl font-semibold">
              {stats.byEmploymentStatus.find((s) => s.status === "ACTIVE")
                ?.count ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Cities</p>
            <p className="mt-1 text-2xl font-semibold">{stats.byCity.length}</p>
          </Card>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-base font-medium">Headcount by City</h2>
          {stats && stats.byCity.length > 0 ? (
            <DataTable
              headers={["City", "Code", "Count"]}
              rows={stats.byCity.map((row) => [
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
          <h2 className="mb-3 text-base font-medium">Approval Status</h2>
          {stats && stats.approvalByStatus.length > 0 ? (
            <DataTable
              headers={["Status", "Count"]}
              rows={stats.approvalByStatus.map((row) => [
                row.status,
                String(row.count),
              ])}
            />
          ) : (
            <p className="text-sm text-muted">No data</p>
          )}
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="text-base font-medium">Employee Report</h2>

        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={handleFilterSubmit}
        >
          <Input
            placeholder="Search name, no, email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={filters.cityId ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                page: 1,
                cityId: e.target.value || undefined,
              }))
            }
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={filters.employmentStatus ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                page: 1,
                employmentStatus:
                  (e.target.value as EmploymentStatus) || undefined,
              }))
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={loading}>
            Apply filters
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted">Loading employees…</p>
        ) : (
          <>
            <DataTable
              headers={[
                "Employee No",
                "Name",
                "City",
                "Status",
                "Job Title",
                "Email",
              ]}
              rows={employeeRows}
            />
            {employees && employees.meta.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted">
                <span>
                  Page {employees.meta.page} of {employees.meta.totalPages} (
                  {employees.meta.total} total)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={employees.meta.page <= 1}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.max(1, (prev.page ?? 1) - 1),
                      }))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={
                      employees.meta.page >= employees.meta.totalPages
                    }
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: (prev.page ?? 1) + 1,
                      }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
