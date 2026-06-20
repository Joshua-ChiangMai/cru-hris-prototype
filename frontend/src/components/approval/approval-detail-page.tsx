"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApprovalChangeDiff } from "@/components/approval/approval-change-diff";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-provider";
import {
  approveRequest,
  cancelRequest,
  fetchApprovalRequest,
  rejectRequest,
} from "@/lib/approval/api";
import { domainLabel } from "@/lib/approval/diff";
import type { UpdateRequest } from "@/lib/approval/types";

type ApprovalDetailPageProps = {
  requestId: string;
};

export function ApprovalDetailPage({ requestId }: ApprovalDetailPageProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [request, setRequest] = useState<UpdateRequest | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canReview =
    session?.scopeLevel === "CITY" || session?.scopeLevel === "ALL";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchApprovalRequest(requestId);
      setRequest(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove() {
    if (!request) return;
    setActionError(null);
    try {
      await approveRequest(request.id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approve failed");
    }
  }

  async function handleReject() {
    if (!request) return;
    if (rejectComment.trim().length < 3) {
      setActionError("Rejection reason is required (min 3 characters).");
      return;
    }
    setActionError(null);
    try {
      await rejectRequest(request.id, rejectComment.trim());
      setRejectComment("");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Reject failed");
    }
  }

  async function handleCancel() {
    if (!request) return;
    setActionError(null);
    try {
      await cancelRequest(request.id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading request details...</p>;
  }

  if (error || !request) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-300">{error ?? "Request not found"}</p>
        <Link href="/approvals/my-requests" className="text-sm text-primary hover:underline">
          Back to requests
        </Link>
      </div>
    );
  }

  const backHref =
    session?.scopeLevel === "OWN" ? "/approvals/my-requests" : "/approvals";

  return (
    <div className="space-y-5">
      <header>
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="mb-2 text-sm text-primary hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold">Approval Details</h1>
        <p className="text-sm text-muted">
          {request.requestNo} · {domainLabel(request.changeDomain)} ·{" "}
          <span className="font-medium text-foreground">{request.status}</span>
        </p>
      </header>

      <Card>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Employee</dt>
            <dd>
              {request.targetEmployee.firstName} {request.targetEmployee.lastName}{" "}
              ({request.targetEmployee.employeeNo})
            </dd>
          </div>
          <div>
            <dt className="text-muted">Requester</dt>
            <dd>
              {request.requester.firstName} {request.requester.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-muted">City</dt>
            <dd>{request.city.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Submitted</dt>
            <dd>
              {request.submittedAt
                ? new Date(request.submittedAt).toLocaleString()
                : "—"}
            </dd>
          </div>
          {request.resolvedAt ? (
            <div>
              <dt className="text-muted">Resolved</dt>
              <dd>{new Date(request.resolvedAt).toLocaleString()}</dd>
            </div>
          ) : null}
          {request.rejectionReason ? (
            <div className="sm:col-span-2">
              <dt className="text-muted">Rejection reason</dt>
              <dd className="text-red-300">{request.rejectionReason}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {actionError ? (
        <p className="text-sm text-red-300">{actionError}</p>
      ) : null}

      {request.status === "PENDING" && request.canReview && canReview ? (
        <Card className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-xs text-muted">
              Rejection reason (required to reject)
            </label>
            <Input
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Reason for rejection"
            />
          </div>
          <Button type="button" onClick={() => void handleApprove()}>
            Approve
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleReject()}>
            Reject
          </Button>
        </Card>
      ) : null}

      {request.canCancel && request.status === "PENDING" ? (
        <Button type="button" variant="outline" onClick={() => void handleCancel()}>
          Cancel request
        </Button>
      ) : null}

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
                {log.action}
                {log.fromStatus && log.toStatus
                  ? ` (${log.fromStatus} → ${log.toStatus})`
                  : log.toStatus
                    ? ` → ${log.toStatus}`
                    : ""}
              </p>
              <p className="text-xs text-muted">
                {log.actorUser.email} · {new Date(log.createdAt).toLocaleString()}
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
