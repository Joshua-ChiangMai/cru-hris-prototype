"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { MarriageRequest, MarriageRequestStatus } from "@/lib/marriage/types";

const STATUS_LABELS: Record<MarriageRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

function statusClass(status: MarriageRequestStatus): string {
  switch (status) {
    case "PENDING":
      return "text-amber-300";
    case "APPROVED":
      return "text-emerald-300";
    case "REJECTED":
      return "text-red-300";
    default:
      return "text-muted";
  }
}

export function MarriageRequestList({
  requests,
  selectedId,
  onSelect,
}: {
  requests: MarriageRequest[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
}) {
  if (requests.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">No marriage requests found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <button
          key={request.id}
          type="button"
          onClick={() => onSelect?.(request.id)}
          className={cn(
            "w-full rounded-lg border p-4 text-left transition-colors",
            selectedId === request.id
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-slate-600",
            !onSelect && "cursor-default",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-sm font-semibold">{request.requestNo}</p>
              <p className="mt-1 text-sm">
                {request.requester.fullName} & {request.spouse.fullName}
              </p>
              <p className="mt-1 text-xs text-muted">
                {request.requester.employeeNo} → {request.spouse.employeeNo}
              </p>
            </div>
            <span className={cn("text-xs font-medium uppercase", statusClass(request.status))}>
              {STATUS_LABELS[request.status]}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Submitted {new Date(request.submittedAt).toLocaleString()} ·{" "}
            {request.city.name} ({request.city.code})
          </p>
        </button>
      ))}
    </div>
  );
}
