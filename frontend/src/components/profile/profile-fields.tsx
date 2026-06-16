"use client";

import { Input } from "@/components/ui/input";
import type { ReactNode } from "react";

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-4">
      <label className="text-sm text-muted">{label}</label>
      <div>{children}</div>
    </div>
  );
}

export function ReadOnlyValue({ value }: { value: string | null | undefined }) {
  return (
    <p className="text-sm text-foreground">
      {value?.trim() ? value : <span className="text-muted">—</span>}
    </p>
  );
}

export function ProfileInput(
  props: React.ComponentProps<typeof Input> & { readOnly?: boolean },
) {
  const { readOnly, className, ...rest } = props;
  if (readOnly) {
    return <ReadOnlyValue value={String(rest.value ?? "")} />;
  }
  return <Input className={className} {...rest} />;
}

export function ProfileSelect({
  value,
  onChange,
  options,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  readOnly?: boolean;
}) {
  if (readOnly) {
    const label = options.find((o) => o.value === value)?.label ?? value;
    return <ReadOnlyValue value={label || null} />;
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
