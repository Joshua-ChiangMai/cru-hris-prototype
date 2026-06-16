"use client";

import { ReactNode } from "react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/auth/types";
import { Role } from "@/lib/rbac";

type AppShellProps = {
  session: Session;
  role: Role;
  email: string;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({ session, role, email, onLogout, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col rounded-lg border border-border bg-card p-4">
          <div className="mb-6 border-b border-border pb-4">
            <h1 className="text-lg font-semibold">HRIS P1</h1>
            <p className="mt-1 truncate text-xs text-muted">{email}</p>
            <p className="text-xs text-muted">Role: {role}</p>
          </div>
          <SidebarNav session={session} />
          <div className="mt-auto pt-4">
            <Button variant="outline" className="w-full" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
