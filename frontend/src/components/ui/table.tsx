import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TableProps = {
  className?: string;
  headers: string[];
  rows: ReactNode[][];
};

export function DataTable({ className, headers, rows }: TableProps) {
  return (
    <div className={cn("overflow-auto rounded-lg border border-border", className)}>
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left font-medium text-muted">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
              {row.map((cell, cellIndex) => (
                <td key={`${idx}-${cellIndex}`} className="px-4 py-3 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
