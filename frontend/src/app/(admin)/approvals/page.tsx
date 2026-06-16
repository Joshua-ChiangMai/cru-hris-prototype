"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApprovalCenterPage } from "@/components/approval/approval-center-page";
import { useAuth } from "@/context/auth-provider";

export default function ApprovalsPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !session) {
      return;
    }
    if (session.scopeLevel === "OWN") {
      router.replace("/approvals/my-requests");
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  if (session.scopeLevel === "OWN") {
    return null;
  }

  return <ApprovalCenterPage />;
}
