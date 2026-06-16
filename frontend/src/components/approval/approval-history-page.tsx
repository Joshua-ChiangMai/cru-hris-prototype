"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApprovalRequestList } from "@/components/approval/approval-request-list";
import { EmployeePagination } from "@/components/employees/employee-pagination";
import { useAuth } from "@/context/auth-provider";
import { fetchApprovalRequests } from "@/lib/approval/api";
import { DOMAIN_LABELS, type ApprovalChangeDomain } from "@/lib/approval/domains";
import type { UpdateRequest } from "@/lib/approval/types";

export function ApprovalHistoryPage() {
  const { session } = useAuth();
  const [page, setPage] = useState(1);
  const [domain, setDomain] = useState<ApprovalChangeDomain | "">("");
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isHr = session?.scopeLevel === "CITY" || session?.scopeLevel === "ALL";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApprovalRequests({
        page,
        limit: 20,
        history: true,
        changeDomain: domain || undefined,
      });
      setRequests(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [page, domain]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Approval History</h1>
        <p className="text-sm text-muted">
          Resolved change requests with before/after audit snapshots.
          {isHr ? " Showing requests within your access scope." : " Showing your submitted requests."}
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
        {isHr ? (
          <Link href="/approvals" className="text-sm text-primary hover:underline">
            Back to Approval Center
          </Link>
        ) : (
          <Link
            href="/approvals/my-requests"
            className="text-sm text-primary hover:underline"
          >
            Back to My Requests
          </Link>
        )}
      </Card>

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted">Loading history...</p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
