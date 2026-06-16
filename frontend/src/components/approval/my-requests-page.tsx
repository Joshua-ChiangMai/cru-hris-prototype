"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApprovalRequestList } from "@/components/approval/approval-request-list";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { cancelRequest, fetchApprovalRequests } from "@/lib/approval/api";
import type { UpdateRequest, UpdateRequestStatus } from "@/lib/approval/types";

export function MyRequestsPage() {
  const [status, setStatus] = useState<UpdateRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApprovalRequests({
        page,
        limit: 15,
        status: status || undefined,
      });
      setRequests(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel(id: string) {
    setActionError(null);
    try {
      await cancelRequest(id, "Cancelled by requester");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">My Requests</h1>
        <p className="text-sm text-muted">
          Track change requests for Personal, Contact, Family, and Passport
          information. Updates apply only after HR approval.
        </p>
      </header>

      <Card className="flex flex-wrap items-center gap-3">
        <select
          className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as UpdateRequestStatus | "");
          }}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
        <Link
          href="/approvals/history"
          className="text-sm text-primary hover:underline"
        >
          View approval history
        </Link>
      </Card>

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading your requests...</p>
      ) : (
        <>
          {actionError ? (
            <p className="text-sm text-red-300">{actionError}</p>
          ) : null}
          <ApprovalRequestList
            requests={requests}
            selectedId={null}
            onSelect={() => {}}
            linkToDetail
          />
          <EmployeePagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
          {requests.some((r) => r.canCancel) ? (
            <Card>
              <p className="mb-2 text-sm text-muted">
                Pending requests can be cancelled from the detail page.
              </p>
              {requests
                .filter((r) => r.canCancel && r.status === "PENDING")
                .map((r) => (
                  <div
                    key={r.id}
                    className="mt-2 flex items-center justify-between gap-2 text-sm"
                  >
                    <span>{r.requestNo}</span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleCancel(r.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
