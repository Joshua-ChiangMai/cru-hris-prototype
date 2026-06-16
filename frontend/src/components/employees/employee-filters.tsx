"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CitySummary, EmploymentStatus } from "@/lib/employees/types";

export type EmployeeFiltersValue = {
  search: string;
  cityId: string;
  employmentStatus: string;
};

type EmployeeFiltersProps = {
  cities: CitySummary[];
  value: EmployeeFiltersValue;
  showCityFilter: boolean;
  onChange: (value: EmployeeFiltersValue) => void;
  onSubmit: () => void;
};

export function EmployeeFilters({
  cities,
  value,
  showCityFilter,
  onChange,
  onSubmit,
}: EmployeeFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      className="grid gap-3 md:grid-cols-4"
      onSubmit={handleSubmit}
    >
      <Input
        placeholder="Search name, email, employee no."
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
      />
      {showCityFilter ? (
        <select
          className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground"
          value={value.cityId}
          onChange={(e) => onChange({ ...value, cityId: e.target.value })}
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="hidden md:block" />
      )}
      <select
        className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground"
        value={value.employmentStatus}
        onChange={(e) =>
          onChange({ ...value, employmentStatus: e.target.value })
        }
      >
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="TERMINATED">Terminated</option>
      </select>
      <Button type="submit">Apply filters</Button>
    </form>
  );
}
