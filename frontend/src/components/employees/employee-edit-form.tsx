"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CitySummary,
  EmployeeDetail,
  EmploymentStatus,
  UpdateEmployeePayload,
} from "@/lib/employees/types";
import {
  extractSensitiveChanges,
  hasSensitiveChanges,
} from "@/lib/approval/sensitive-fields";

type EmployeeEditFormProps = {
  employee: EmployeeDetail;
  cities: CitySummary[];
  onSave: (payload: UpdateEmployeePayload) => Promise<void>;
  onSubmitSensitiveRequest?: (
    changes: Record<string, unknown>
  ) => Promise<void>;
};

export function EmployeeEditForm({
  employee,
  cities,
  onSave,
  onSubmitSensitiveRequest,
}: EmployeeEditFormProps) {
  const [form, setForm] = useState({
    employeeNo: employee.employeeNo,
    firstName: employee.firstName,
    lastName: employee.lastName,
    workEmail: employee.workEmail ?? "",
    phone: employee.phone ?? "",
    jobTitle: employee.jobTitle ?? "",
    cityId: employee.cityId,
    employmentStatus: employee.employmentStatus,
    hireDate: employee.hireDate
      ? new Date(employee.hireDate).toISOString().slice(0, 10)
      : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      employeeNo: employee.employeeNo,
      firstName: employee.firstName,
      lastName: employee.lastName,
      workEmail: employee.workEmail ?? "",
      phone: employee.phone ?? "",
      jobTitle: employee.jobTitle ?? "",
      cityId: employee.cityId,
      employmentStatus: employee.employmentStatus,
      hireDate: employee.hireDate
        ? new Date(employee.hireDate).toISOString().slice(0, 10)
        : "",
    });
  }, [employee]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const currentSnapshot: Record<string, unknown> = {
        employeeNo: employee.employeeNo,
        firstName: employee.firstName,
        lastName: employee.lastName,
        workEmail: employee.workEmail,
        employmentStatus: employee.employmentStatus,
        cityId: employee.cityId,
        hireDate: employee.hireDate
          ? new Date(employee.hireDate).toISOString().slice(0, 10)
          : null,
      };

      const proposed: Record<string, unknown> = {
        employeeNo: form.employeeNo,
        firstName: form.firstName,
        lastName: form.lastName,
        workEmail: form.workEmail || null,
        phone: form.phone || null,
        jobTitle: form.jobTitle || null,
        cityId: form.cityId,
        employmentStatus: form.employmentStatus,
        hireDate: form.hireDate || null,
      };

      if (
        !employee.canEditAllFields &&
        hasSensitiveChanges(currentSnapshot, proposed)
      ) {
        if (!onSubmitSensitiveRequest) {
          throw new Error("Sensitive updates require approval workflow.");
        }
        const changes = extractSensitiveChanges(currentSnapshot, proposed);
        await onSubmitSensitiveRequest(changes);
        setSuccess(
          "Sensitive changes submitted for HR/Admin approval (status: Pending)."
        );
        return;
      }

      const payload: UpdateEmployeePayload = employee.canEditAllFields
        ? {
            employeeNo: form.employeeNo,
            firstName: form.firstName,
            lastName: form.lastName,
            workEmail: form.workEmail || undefined,
            phone: form.phone || undefined,
            jobTitle: form.jobTitle || undefined,
            cityId: form.cityId,
            employmentStatus: form.employmentStatus as EmploymentStatus,
            hireDate: form.hireDate || undefined,
          }
        : {
            phone: form.phone || undefined,
            jobTitle: form.jobTitle || undefined,
          };

      await onSave(payload);
      setSuccess("Profile saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  const readOnly = !employee.canEdit;

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
      {error ? (
        <p className="md:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="md:col-span-2 rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      <Field label="Employee No">
        <Input
          value={form.employeeNo}
          disabled={readOnly}
          onChange={(e) => setForm({ ...form, employeeNo: e.target.value })}
        />
      </Field>
      <Field label="Status">
        <select
          className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
          value={form.employmentStatus}
          disabled={readOnly}
          onChange={(e) =>
            setForm({
              ...form,
              employmentStatus: e.target.value as EmploymentStatus,
            })
          }
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </Field>
      <Field label="First Name">
        <Input
          value={form.firstName}
          disabled={readOnly}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
      </Field>
      <Field label="Last Name">
        <Input
          value={form.lastName}
          disabled={readOnly}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </Field>
      <Field label="Work Email">
        <Input
          type="email"
          value={form.workEmail}
          disabled={readOnly}
          onChange={(e) => setForm({ ...form, workEmail: e.target.value })}
        />
      </Field>
      <Field label="Phone">
        <Input
          value={form.phone}
          disabled={readOnly}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </Field>
      <Field label="Job Title">
        <Input
          value={form.jobTitle}
          disabled={readOnly}
          onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
        />
      </Field>
      <Field label="City">
        {employee.canEditAllFields ? (
          <select
            className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
            value={form.cityId}
            disabled={readOnly}
            onChange={(e) => setForm({ ...form, cityId: e.target.value })}
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        ) : (
          <Input value={employee.city.name} disabled />
        )}
      </Field>
      <Field label="Hire Date">
        <Input
          type="date"
          value={form.hireDate}
          disabled={readOnly}
          onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
        />
      </Field>

      {!employee.canEditAllFields ? (
        <p className="md:col-span-2 text-xs text-muted">
          Changes to name, email, status, city, or hire date require HR/Admin
          approval.
        </p>
      ) : null}

      {employee.canEdit ? (
        <div className="md:col-span-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      ) : (
        <p className="md:col-span-2 text-sm text-muted">Read-only access.</p>
      )}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}
