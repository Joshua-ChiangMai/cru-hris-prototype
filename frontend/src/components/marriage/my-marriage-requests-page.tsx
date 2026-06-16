"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { MarriageRequestList } from "@/components/marriage/marriage-request-list";
import {
  cancelMarriageRequest,
  fetchEligibleSpouses,
  fetchMyMarriageRequests,
  submitMarriageRequest,
} from "@/lib/marriage/api";
import type {
  EligibleSpouse,
  MarriageRequest,
  MarriageRequestStatus,
} from "@/lib/marriage/types";

export function MyMarriageRequestsPage() {
  const [status, setStatus] = useState<MarriageRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<MarriageRequest[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [eligibleSpouses, setEligibleSpouses] = useState<EligibleSpouse[]>([]);
  const [spouseEmployeeId, setSpouseEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMyMarriageRequests({
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

  const loadEligibleSpouses = useCallback(async () => {
    try {
      const result = await fetchEligibleSpouses();
      setEligibleSpouses(result.data);
    } catch {
      setEligibleSpouses([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadEligibleSpouses();
  }, [loadEligibleSpouses]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!spouseEmployeeId) {
      setActionError("Select a spouse employee to continue.");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      await submitMarriageRequest(spouseEmployeeId);
      setSpouseEmployeeId("");
      await load();
      await loadEligibleSpouses();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    setActionError(null);
    try {
      await cancelMarriageRequest(id);
      await load();
      await loadEligibleSpouses();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  const cancellable = requests.filter((request) => request.canCancel);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">My Marriage Requests</h1>
        <p className="text-sm text-muted">
          Submit a marriage request when two employees plan to merge family
          accounts. HR reviews the request before families are combined.
        </p>
      </header>

      <Card>
        <h2 className="mb-3 text-base font-medium">Submit marriage request</h2>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => void handleSubmit(e)}>
          <label className="min-w-[280px] flex-1 text-sm">
            <span className="mb-1 block text-muted">Spouse employee</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={spouseEmployeeId}
              onChange={(e) => setSpouseEmployeeId(e.target.value)}
            >
              <option value="">Select employee…</option>
              {eligibleSpouses.map((spouse) => (
                <option key={spouse.id} value={spouse.id}>
                  {spouse.fullName} ({spouse.employeeNo}) · {spouse.city.code}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={submitting || eligibleSpouses.length === 0}>
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </form>
        {eligibleSpouses.length === 0 ? (
          <p className="mt-2 text-xs text-muted">
            No eligible spouse employees in your scope right now.
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-wrap items-center gap-3">
        <select
          className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as MarriageRequestStatus | "");
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
      </Card>

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading your marriage requests…</p>
      ) : (
        <>
          {actionError ? (
            <p className="text-sm text-red-300">{actionError}</p>
          ) : null}
          <MarriageRequestList requests={requests} selectedId={null} />
          <EmployeePagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
          {cancellable.length > 0 ? (
            <Card>
              <p className="mb-2 text-sm text-muted">Pending requests you submitted:</p>
              <div className="space-y-2">
                {cancellable.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-sm font-mono">{request.requestNo}</span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleCancel(request.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
