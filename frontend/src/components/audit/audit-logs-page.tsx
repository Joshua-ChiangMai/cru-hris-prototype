"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { fetchAuditFilterOptions, fetchAuditLogs } from "@/lib/audit/api";
import type {
  AuditAction,
  AuditEntity,
  AuditFilterOptions,
  AuditLogEntry,
} from "@/lib/audit/types";
import { cn } from "@/lib/cn";

const SELECT_CLASS =
  "h-10 rounded-md border border-border bg-card px-3 text-sm";

function formatJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function AuditLogRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: AuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{new Date(entry.createdAt).toLocaleString()}</span>
            <span>·</span>
            <span>{entry.actor.email}</span>
          </div>
          <p className="mt-1 text-sm font-medium">
            {entry.actionLabel} · {entry.entityLabel}
          </p>
          {entry.entityId ? (
            <p className="mt-1 font-mono text-xs text-muted">{entry.entityId}</p>
          ) : null}
        </div>
        <span className="text-xs text-primary">{expanded ? "Hide" : "Details"}</span>
      </button>

      {expanded ? (
        <div className="grid gap-3 border-t border-border p-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Before
            </p>
            <pre className="max-h-64 overflow-auto rounded-md border border-border bg-background p-3 text-xs">
              {formatJson(entry.beforeValue)}
            </pre>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              After
            </p>
            <pre className="max-h-64 overflow-auto rounded-md border border-border bg-background p-3 text-xs">
              {formatJson(entry.afterValue)}
            </pre>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilterOptions | null>(null);

  const [actorUserId, setActorUserId] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [entity, setEntity] = useState<AuditEntity | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAuditLogs({
        page,
        limit: 20,
        actorUserId: actorUserId || undefined,
        action: action || undefined,
        entity: entity || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, actorUserId, action, entity, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchAuditFilterOptions()
      .then(setFilters)
      .catch(() => setFilters(null));
  }, []);

  function resetFilters() {
    setPage(1);
    setActorUserId("");
    setAction("");
    setEntity("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted">
          Immutable change history for profile updates, approval actions, and
          family changes. Admin access only.
        </p>
      </header>

      <Card className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-sm">
          <span className="mb-1 block text-muted">User</span>
          <select
            className={cn(SELECT_CLASS, "w-full")}
            value={actorUserId}
            onChange={(e) => {
              setPage(1);
              setActorUserId(e.target.value);
            }}
          >
            <option value="">All users</option>
            {filters?.actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.email}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-muted">Action</span>
          <select
            className={cn(SELECT_CLASS, "w-full")}
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value as AuditAction | "");
            }}
          >
            <option value="">All actions</option>
            {filters?.actions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label} ({item.count})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-muted">Entity</span>
          <select
            className={cn(SELECT_CLASS, "w-full")}
            value={entity}
            onChange={(e) => {
              setPage(1);
              setEntity(e.target.value as AuditEntity | "");
            }}
          >
            <option value="">All entities</option>
            {filters?.entities.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label} ({item.count})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-muted">Date from</span>
          <input
            type="date"
            className={cn(SELECT_CLASS, "w-full")}
            value={dateFrom}
            onChange={(e) => {
              setPage(1);
              setDateFrom(e.target.value);
            }}
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-muted">Date to</span>
          <input
            type="date"
            className={cn(SELECT_CLASS, "w-full")}
            value={dateTo}
            onChange={(e) => {
              setPage(1);
              setDateTo(e.target.value);
            }}
          />
        </label>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
        <Button type="button" variant="outline" onClick={resetFilters}>
          Clear filters
        </Button>
        <p className="self-center text-sm text-muted">{total} log entries</p>
      </div>

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading audit logs…</p>
      ) : logs.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No audit logs match the current filters.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map((entry) => (
              <AuditLogRow
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === entry.id ? null : entry.id,
                  )
                }
              />
            ))}
          </div>
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
