"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { domainLabel } from "@/lib/approval/diff";
import type { UpdateRequest } from "@/lib/approval/types";

type ApprovalRequestListProps = {
  requests: UpdateRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  linkToDetail?: boolean;
};

export function ApprovalRequestList({
  requests,
  selectedId,
  onSelect,
  linkToDetail = false,
}: ApprovalRequestListProps) {
  if (requests.length === 0) {
    return <p className="text-sm text-muted">No requests found.</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((item) => {
        const content = (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.requestNo}</p>
                <p className="text-sm text-muted">
                  {item.targetEmployee.firstName} {item.targetEmployee.lastName}
                </p>
                <p className="text-xs text-muted">
                  {domainLabel(item.changeDomain)} · {item.status}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            {item.submittedAt ? (
              <p className="mt-2 text-xs text-muted">
                Submitted {new Date(item.submittedAt).toLocaleString()}
              </p>
            ) : null}
          </>
        );

        if (linkToDetail) {
          return (
            <Link
              key={item.id}
              href={`/approvals/${item.id}`}
              className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-slate-600"
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "w-full rounded-lg border border-border bg-card p-4 text-left transition-colors",
              selectedId === item.id ? "border-primary" : "hover:border-slate-600",
            )}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[status] ?? styles.CANCELLED,
      )}
    >
      {status}
    </span>
  );
}
