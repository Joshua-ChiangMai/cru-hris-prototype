"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { MarriageRequestList } from "@/components/marriage/marriage-request-list";
import {
  approveMarriageRequest,
  fetchMarriageApprovalQueue,
  rejectMarriageRequest,
} from "@/lib/marriage/api";
import type { MarriageRequest } from "@/lib/marriage/types";

export function MarriageApprovalPage() {
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<MarriageRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MarriageRequest | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMarriageApprovalQueue({
        page,
        limit: 15,
        pendingOnly: true,
      });
      setRequests(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);

      if (selectedId) {
        const match = result.data.find((row) => row.id === selectedId) ?? null;
        setSelected(match);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [page, selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectRequest(id: string) {
    setSelectedId(id);
    setActionError(null);
    setSelected(requests.find((row) => row.id === id) ?? null);
  }

  async function handleApprove(id: string) {
    setActionError(null);
    try {
      await approveMarriageRequest(id);
      setSelectedId(null);
      setSelected(null);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approve failed");
    }
  }

  async function handleReject(id: string) {
    if (rejectReason.trim().length < 3) {
      setActionError("Rejection reason is required (min 3 characters).");
      return;
    }
    setActionError(null);
    try {
      await rejectMarriageRequest(id, rejectReason.trim());
      setRejectReason("");
      setSelectedId(null);
      setSelected(null);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Reject failed");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Marriage Approval Queue</h1>
        <p className="text-sm text-muted">
          Review pending marriage requests. Approval merges family accounts,
          creates a spouse relationship, and updates family membership.
        </p>
      </header>

      <Card className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
        <p className="text-sm text-muted self-center">
          {total} pending request{total === 1 ? "" : "s"}
        </p>
      </Card>

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading approval queue…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="space-y-3">
            <MarriageRequestList
              requests={requests}
              selectedId={selectedId}
              onSelect={selectRequest}
            />
            <EmployeePagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          </div>

          <Card className="h-fit space-y-4">
            <h2 className="text-base font-medium">Review request</h2>
            {!selected ? (
              <p className="text-sm text-muted">
                Select a pending request to approve or reject.
              </p>
            ) : (
              <>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-muted">Request</dt>
                    <dd className="font-mono">{selected.requestNo}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Requester</dt>
                    <dd>
                      {selected.requester.fullName} ({selected.requester.employeeNo})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Spouse</dt>
                    <dd>
                      {selected.spouse.fullName} ({selected.spouse.employeeNo})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">City</dt>
                    <dd>
                      {selected.city.name} ({selected.city.code})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Submitted</dt>
                    <dd>{new Date(selected.submittedAt).toLocaleString()}</dd>
                  </div>
                </dl>

                {actionError ? (
                  <p className="text-sm text-red-300">{actionError}</p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleApprove(selected.id)}
                  >
                    Approve & merge families
                  </Button>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <label className="block text-sm text-muted">
                    Rejection reason
                  </label>
                  <Input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleReject(selected.id)}
                  >
                    Reject request
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
