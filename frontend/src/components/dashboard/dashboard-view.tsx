"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { fetchDashboard } from "@/lib/reports/api";
import type { DashboardSummary } from "@/lib/reports/types";

export function DashboardView() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const summary = await fetchDashboard();
        if (!cancelled) {
          setData(summary);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-muted">Loading dashboard metrics...</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (!data) {
    return null;
  }

  const scopeLabel =
    data.scopeLevel === "ALL"
      ? "All cities"
      : data.scopeLevel === "CITY"
        ? "Your assigned cities"
        : "Your profile";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">
          Operational HR overview — {scopeLabel}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">Total Employees</p>
          <p className="mt-1 text-2xl font-semibold">{data.employeeCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Pending Approvals</p>
          <p className="mt-1 text-2xl font-semibold">{data.pendingApprovals}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Cities in Scope</p>
          <p className="mt-1 text-2xl font-semibold">{data.citySummary.length}</p>
        </Card>
      </section>

      <Card>
        <h2 className="mb-3 text-base font-medium">Headcount by City</h2>
        {data.citySummary.length === 0 ? (
          <p className="text-sm text-muted">No city data in your scope.</p>
        ) : (
          <DataTable
            headers={["City", "Code", "Employees"]}
            rows={data.citySummary.map((row) => [
              row.cityName,
              row.cityCode,
              String(row.employeeCount),
            ])}
          />
        )}
      </Card>
    </div>
  );
}
