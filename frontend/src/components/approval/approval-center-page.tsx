"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApprovalChangeDiff } from "@/components/approval/approval-change-diff";
import { ApprovalRequestList } from "@/components/approval/approval-request-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { useAuth } from "@/context/auth-provider";
import {
  approveRequest,
  cancelRequest,
  fetchApprovalRequest,
  fetchApprovalRequests,
  rejectRequest,
} from "@/lib/approval/api";
import { DOMAIN_LABELS, type ApprovalChangeDomain } from "@/lib/approval/domains";
import type { UpdateRequest } from "@/lib/approval/types";

export function ApprovalCenterPage() {
  const { session } = useAuth();
  const [domain, setDomain] = useState<ApprovalChangeDomain | "">("");
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<UpdateRequest | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
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
      const result = await fetchApprovalRequests({
        page,
        limit: 15,
        pendingOnly: true,
        changeDomain: domain || undefined,
      });
      setRequests(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);

      if (selectedId) {
        const detail = await fetchApprovalRequest(selectedId);
        setSelected(detail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page, domain, selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function selectRequest(id: string) {
    setSelectedId(id);
    setActionError(null);
    try {
      const detail = await fetchApprovalRequest(id);
      setSelected(detail);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load detail");
    }
  }

  async function handleApprove(id: string) {
    setActionError(null);
    try {
      await approveRequest(id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approve failed");
    }
  }

  async function handleReject(id: string) {
    if (rejectComment.trim().length < 3) {
      setActionError("Rejection reason is required (min 3 characters).");
      return;
    }
    setActionError(null);
    try {
      await rejectRequest(id, rejectComment.trim());
      setRejectComment("");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Reject failed");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Approval Center</h1>
        <p className="text-sm text-muted">
          Review pending Personal, Contact, Family, and Passport change requests.
          Approved changes are applied to production data; rejected requests keep
          the original records.
        </p>
      </header>

      <Card className="flex flex-wrap gap-3">
        <select
          className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          value={domain}
          onChange={(e) => {
            setPage(1);
            setDomain(e.target.value as ApprovalChangeDomain | "");
          }}
        >
          <option value="">All domains</option>
          {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
        <Link href="/approvals/history" className="text-sm text-primary hover:underline">
          Approval History
        </Link>
      </Card>

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading pending requests...</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="space-y-3">
            <ApprovalRequestList
              requests={requests}
              selectedId={selectedId}
              onSelect={(id) => void selectRequest(id)}
            />
            <EmployeePagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>

          <div className="space-y-3">
            {actionError ? (
              <p className="text-sm text-red-300">{actionError}</p>
            ) : null}
            {selected ? (
              <>
                <Card className="flex flex-wrap gap-2">
                  <Link
                    href={`/approvals/${selected.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Open full details
                  </Link>
                </Card>
                {selected.canReview && canReview && selected.status === "PENDING" ? (
                  <Card>
                    <label className="mb-1 block text-xs text-muted">
                      Rejection reason
                    </label>
                    <Input
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      placeholder="Required when rejecting"
                    />
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        onClick={() => void handleApprove(selected.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleReject(selected.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ) : null}
                <ApprovalChangeDiff request={selected} />
              </>
            ) : (
              <Card>
                <p className="text-sm text-muted">
                  Select a pending request to review before/after snapshots.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
