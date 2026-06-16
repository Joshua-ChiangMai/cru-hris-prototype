"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/context/auth-provider";
import { canAccessPath } from "@/lib/auth/roles";

type ProtectedShellProps = {
  children: ReactNode;
};

export function ProtectedShell({ children }: ProtectedShellProps) {
  const { session, role, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!session || !role) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    if (!canAccessPath(session, pathname)) {
      router.replace("/dashboard");
    }
  }, [isLoading, session, role, pathname, router]);

  if (isLoading || !session || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted">
        Loading session...
      </div>
    );
  }

  return (
    <AppShell
      session={session}
      role={role}
      email={session.email}
      onLogout={() => void logout()}
    >
      {children}
    </AppShell>
  );
}
