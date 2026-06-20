"use client";

import { ApprovalChangeDiff } from "@/components/approval/approval-change-diff";
import { Card } from "@/components/ui/card";
import type { UpdateRequest } from "@/lib/approval/types";

type ApprovalRequestDetailProps = {
  request: UpdateRequest;
};

export function ApprovalRequestDetail({ request }: ApprovalRequestDetailProps) {
  return (
    <div className="space-y-4">
      <ApprovalChangeDiff request={request} />
      <Card>
        <h3 className="mb-3 text-sm font-medium">Audit trail</h3>
        <ul className="space-y-2 text-sm">
          {request.approvalLogs.map((log) => (
            <li
              key={log.id}
              className="rounded-md border border-border bg-slate-50 px-3 py-2"
            >
              <p className="font-medium">
                {log.action}{" "}
                {log.fromStatus && log.toStatus
                  ? `(${log.fromStatus} → ${log.toStatus})`
                  : log.toStatus
                    ? `→ ${log.toStatus}`
                    : ""}
              </p>
              <p className="text-xs text-muted">
                {log.actorUser.email} ·{" "}
                {new Date(log.createdAt).toLocaleString()}
              </p>
              {log.comment ? (
                <p className="mt-1 text-xs text-muted">{log.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
