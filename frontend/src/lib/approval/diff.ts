import { DOMAIN_LABELS, type ApprovalChangeDomain } from "./domains";

export type DiffRow = {
  path: string;
  before: string;
  after: string;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function flatten(
  obj: Record<string, unknown>,
  prefix = "",
): Array<{ path: string; value: unknown }> {
  const rows: Array<{ path: string; value: unknown }> = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      rows.push(...flatten(value as Record<string, unknown>, path));
    } else if (Array.isArray(value)) {
      rows.push({ path, value: JSON.stringify(value, null, 2) });
    } else {
      rows.push({ path, value });
    }
  }

  return rows;
}

export function buildChangeDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
): DiffRow[] {
  const beforeFlat = flatten(before ?? {});
  const afterFlat = flatten(after);
  const paths = new Set([
    ...beforeFlat.map((r) => r.path),
    ...afterFlat.map((r) => r.path),
  ]);

  const beforeMap = new Map(beforeFlat.map((r) => [r.path, r.value]));
  const afterMap = new Map(afterFlat.map((r) => [r.path, r.value]));

  const rows: DiffRow[] = [];

  for (const path of [...paths].sort()) {
    const b = beforeMap.get(path);
    const a = afterMap.get(path);
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      rows.push({
        path,
        before: formatValue(b),
        after: formatValue(a),
      });
    }
  }

  return rows;
}

export function domainLabel(domain: ApprovalChangeDomain | null): string {
  if (!domain) {
    return "Profile update";
  }
  return DOMAIN_LABELS[domain] ?? domain;
}
