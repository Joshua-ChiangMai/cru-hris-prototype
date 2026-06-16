"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EmployeeTrainingTab } from "@/components/employees/employee-training-tab";
import { ProfilePage } from "@/components/profile/profile-page";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  fetchEmployeeById,
  fetchEmployeeMe,
} from "@/lib/employees/api";
import type { EmployeeDetail } from "@/lib/employees/types";

type EmployeeDetailPageProps = {
  employeeId?: string;
  mode: "by-id" | "me";
};

type EmployeeDetailTab = "profile" | "training";

export function EmployeeDetailPage({ employeeId, mode }: EmployeeDetailPageProps) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EmployeeDetailTab>("profile");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const detail =
        mode === "me" ? await fetchEmployeeMe() : await fetchEmployeeById(employeeId!);
      setEmployee(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employee.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading employee profile...</p>;
  }

  if (error || !employee) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-300">{error ?? "Employee not found."}</p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const headerTitle = mode === "me" ? "My Profile" : "Employee Profile";
  const employeeLabel = `${employee.employeeNo} · ${employee.city.name}`;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{headerTitle}</h1>
          <p className="text-sm text-muted">{employeeLabel}</p>
        </div>

        <nav className="flex gap-2 border-b border-border pb-2">
          {(
            [
              { id: "profile" as const, label: "Profile" },
              { id: "training" as const, label: "Training" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                activeTab === tab.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:bg-muted/10 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "profile" ? (
          <ProfilePage
            employeeId={employee.id}
            mode={mode}
            embedded
          />
        ) : (
          <Card>
            <h2 className="mb-4 text-lg font-medium">Training</h2>
            <EmployeeTrainingTab employeeId={employee.id} mode={mode} />
          </Card>
        )}
      </div>

      {employee.manager ? (
        <Card>
          <h2 className="mb-2 text-lg font-medium">Manager</h2>
          <p className="text-sm">
            {employee.manager.firstName} {employee.manager.lastName} (
            {employee.manager.employeeNo})
          </p>
        </Card>
      ) : null}

      {employee.directReports.length > 0 ? (
        <Card>
          <h2 className="mb-3 text-lg font-medium">Direct Reports</h2>
          <ul className="space-y-2 text-sm">
            {employee.directReports.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/employees/${report.id}`}
                  className="text-primary hover:underline"
                >
                  {report.firstName} {report.lastName}
                </Link>{" "}
                · {report.employeeNo} · {report.employmentStatus}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
