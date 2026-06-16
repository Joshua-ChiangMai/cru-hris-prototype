"use client";

import { Card } from "@/components/ui/card";
import { buildChangeDiff, domainLabel } from "@/lib/approval/diff";
import type { UpdateRequest } from "@/lib/approval/types";

type ApprovalChangeDiffProps = {
  request: UpdateRequest;
};

export function ApprovalChangeDiff({ request }: ApprovalChangeDiffProps) {
  const before = (request.payloadBefore ?? {}) as Record<string, unknown>;
  const after = request.payloadAfter as Record<string, unknown>;
  const rows = buildChangeDiff(before, after);

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Before / after snapshot</h3>
        {request.changeDomain ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            {domainLabel(request.changeDomain)}
          </span>
        ) : null}
      </div>
      {request.changeSummary ? (
        <p className="mb-3 text-xs text-muted">{request.changeSummary}</p>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No field differences recorded.</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2 pr-4">Field</th>
                <th className="pb-2 pr-4">Before (production)</th>
                <th className="pb-2">After (requested)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.path} className="border-t border-border align-top">
                  <td className="py-2 pr-4 font-mono text-xs">{row.path}</td>
                  <td className="py-2 pr-4 whitespace-pre-wrap text-muted">
                    {row.before}
                  </td>
                  <td className="py-2 whitespace-pre-wrap">{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
