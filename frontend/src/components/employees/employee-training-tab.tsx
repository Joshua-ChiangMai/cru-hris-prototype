"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/table";
import {
  fetchEmployeeTrainings,
  fetchMyTrainings,
} from "@/lib/training/api";
import type { EmployeeTrainingRecord, TrainingStatus } from "@/lib/training/types";

type EmployeeTrainingTabProps = {
  employeeId: string;
  mode: "by-id" | "me";
};

const STATUS_LABELS: Record<TrainingStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EmployeeTrainingTab({
  employeeId,
  mode,
}: EmployeeTrainingTabProps) {
  const [records, setRecords] = useState<EmployeeTrainingRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result =
        mode === "me"
          ? await fetchMyTrainings()
          : await fetchEmployeeTrainings(employeeId);
      setRecords(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load training records."
      );
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading training records...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-muted">No training records assigned yet.</p>
    );
  }

  const headers = ["Course", "Provider", "Completion date", "Status"];
  const rows = records.map((record) => [
    record.training.title,
    record.training.provider,
    formatDate(record.completionDate),
    STATUS_LABELS[record.status],
  ]);

  return <DataTable headers={headers} rows={rows} />;
}
