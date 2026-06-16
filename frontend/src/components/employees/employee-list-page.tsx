"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmployeeFilters,
  type EmployeeFiltersValue,
} from "@/components/employees/employee-filters";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { EmployeeTable } from "@/components/employees/employee-table";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-provider";
import { fetchEmployeeCities, fetchEmployees } from "@/lib/employees/api";
import type { CitySummary, EmployeeListItem } from "@/lib/employees/types";

const defaultFilters: EmployeeFiltersValue = {
  search: "",
  cityId: "",
  employmentStatus: "",
};

export function EmployeeListPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState<EmployeeFiltersValue>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<EmployeeFiltersValue>(defaultFilters);
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [cities, setCities] = useState<CitySummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaffOnly = session?.scopeLevel === "OWN";

  useEffect(() => {
    if (isStaffOnly) {
      router.replace("/employees/me");
    }
  }, [isStaffOnly, router]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listResult, cityResult] = await Promise.all([
        fetchEmployees({
          page,
          limit: 20,
          search: appliedFilters.search || undefined,
          cityId: appliedFilters.cityId || undefined,
          employmentStatus: appliedFilters.employmentStatus
            ? (appliedFilters.employmentStatus as
                | "ACTIVE"
                | "INACTIVE"
                | "TERMINATED")
            : undefined,
        }),
        fetchEmployeeCities(),
      ]);
      setEmployees(listResult.data);
      setTotalPages(listResult.meta.totalPages);
      setTotal(listResult.meta.total);
      setCities(cityResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees.");
    } finally {
      setIsLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    if (!isStaffOnly) {
      void load();
    }
  }, [load, isStaffOnly]);

  if (isStaffOnly) {
    return (
      <p className="text-sm text-muted">Redirecting to your profile...</p>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Employee List</h1>
        <p className="text-sm text-muted">
          Search and filter employees within your access scope.
        </p>
      </header>

      <Card>
        <EmployeeFilters
          cities={cities}
          value={filters}
          showCityFilter={session?.scopeLevel !== "OWN"}
          onChange={setFilters}
          onSubmit={() => {
            setPage(1);
            setAppliedFilters(filters);
          }}
        />
      </Card>

      {error ? (
        <p className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted">Loading employees...</p>
      ) : (
        <>
          <EmployeeTable employees={employees} />
          <EmployeePagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
