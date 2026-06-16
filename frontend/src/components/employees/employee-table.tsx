"use client";

import Link from "next/link";
import { DataTable } from "@/components/ui/table";
import type { EmployeeListItem } from "@/lib/employees/types";

type EmployeeTableProps = {
  employees: EmployeeListItem[];
};

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const headers = [
    "Employee No",
    "Name",
    "City",
    "Job Title",
    "Status",
    "Action",
  ];

  const rows = employees.map((employee) => [
    employee.employeeNo,
    employee.fullName,
    employee.city.name,
    employee.jobTitle ?? "—",
    employee.employmentStatus,
    <Link
      key={employee.id}
      href={`/employees/${employee.id}`}
      className="text-primary hover:underline"
    >
      View
    </Link>,
  ]);

  if (employees.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted">
        No employees match your filters.
      </p>
    );
  }

  return <DataTable headers={headers} rows={rows} />;
}
