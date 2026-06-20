"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  buildSectionPayload,
  renderProfileSection,
} from "@/components/profile/profile-section-forms";
import { submitProfileUpdateRequest } from "@/lib/approval/api";
import { sectionRequiresApproval } from "@/lib/approval/domains";
import {
  fetchEmployeeProfile,
  fetchMyProfile,
  isProfileApprovalRequired,
  updateEmployeeProfile,
  updateMyProfile,
} from "@/lib/profile/api";
import { PROFILE_NAV_ITEMS } from "@/lib/profile/sections";
import type { EmployeeProfile, ProfileSectionId } from "@/lib/profile/types";
import { cn } from "@/lib/cn";

type ProfilePageProps = {
  employeeId?: string;
  mode: "by-id" | "me";
  headerTitle?: string;
  employeeLabel?: string;
  embedded?: boolean;
};

export function ProfilePage({
  employeeId,
  mode,
  headerTitle,
  employeeLabel,
  embedded = false,
}: ProfilePageProps) {
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("basic");
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [original, setOriginal] = useState<EmployeeProfile | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result =
        mode === "me"
          ? await fetchMyProfile()
          : await fetchEmployeeProfile(employeeId!);
      setProfile(result.data);
      setOriginal(structuredClone(result.data));
      setCanEdit(result.meta.canEdit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [employeeId, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!profile || !original) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = buildSectionPayload(activeSection, profile);
    const targetId = profile.employeeId;
    const needsApproval = sectionRequiresApproval(activeSection);

    try {
      if (needsApproval) {
        await submitProfileUpdateRequest(targetId, payload);
        setSuccess(
          "Change request submitted (PENDING). Track progress under My Requests.",
        );
        setProfile(structuredClone(original));
      } else {
        const result =
          mode === "me"
            ? await updateMyProfile(payload)
            : await updateEmployeeProfile(targetId, payload);
        setProfile(result.data);
        setOriginal(structuredClone(result.data));
        setSuccess("Profile section saved.");
      }
    } catch (err) {
      if (!needsApproval && isProfileApprovalRequired(err)) {
        try {
          await submitProfileUpdateRequest(targetId, payload);
          setSuccess(
            "Change request submitted (PENDING). Track progress under My Requests.",
          );
          setProfile(structuredClone(original));
        } catch (submitErr) {
          setError(
            submitErr instanceof Error
              ? submitErr.message
              : "Failed to submit approval request",
          );
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading employee profile...</p>;
  }

  if (error && !profile) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-300">{error}</p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const sectionLabel =
    PROFILE_NAV_ITEMS.find((item) => item.id === activeSection)?.label ??
    "Profile";

  const displayName =
    profile.basic.preferredName?.trim() ||
    `${profile.basic.firstName} ${profile.basic.lastName}`;

  return (
    <div className="space-y-5">
      {!embedded ? (
        <header>
          <h1 className="text-2xl font-semibold">{headerTitle}</h1>
          <p className="text-sm text-muted">
            {displayName}
            {employeeLabel ? ` · ${employeeLabel}` : ""}
            {profile.basic.rcNumber ? ` · RC ${profile.basic.rcNumber}` : ""}
          </p>
        </header>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1 rounded-lg border border-border bg-card p-2">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Profile
          </p>
          {PROFILE_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                setSuccess(null);
                setError(null);
              }}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                activeSection === item.id
                  ? "bg-primary text-primaryForeground"
                  : "text-muted hover:bg-slate-100 hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <Card>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-medium">{sectionLabel}</h2>
            {canEdit && (
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving
                  ? "Submitting..."
                  : sectionRequiresApproval(activeSection)
                    ? "Submit for approval"
                    : "Save section"}
              </Button>
            )}
          </div>

          {error && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-3 rounded-md border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
              {success}
            </p>
          )}

          {renderProfileSection(activeSection, {
            profile,
            readOnly: !canEdit,
            onChange: setProfile,
          })}
        </Card>
      </div>
    </div>
  );
}
