"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FieldRow,
  ProfileInput,
  ProfileSelect,
} from "@/components/profile/profile-fields";
import { submitFamilyUpdateRequest } from "@/lib/approval/api";
import { fetchMyFamily } from "@/lib/family/api";
import type { FamilyDetail, FamilyMember, FamilyRelationship } from "@/lib/family/types";
import { useAuth } from "@/context/auth-provider";

const RELATIONSHIP_OPTIONS: { value: FamilyRelationship; label: string }[] = [
  { value: "WORKER", label: "Worker" },
  { value: "SPOUSE", label: "Spouse" },
  { value: "SON", label: "Son" },
  { value: "DAUGHTER", label: "Daughter" },
  { value: "PARENT", label: "Parent" },
];

export function FamilyInformationPage() {
  const { session } = useAuth();
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [original, setOriginal] = useState<FamilyDetail | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canEdit = session?.permissions.includes("employee_profile:edit");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyFamily();
      setFamily(data);
      setOriginal(structuredClone(data));
      const workerMember = data.members.find((m) => m.relationshipType === "WORKER");
      setEmployeeId(workerMember?.employeeId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load family");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateMember(index: number, patch: Partial<FamilyMember>) {
    if (!family) return;
    const members = [...family.members];
    members[index] = { ...members[index], ...patch };
    setFamily({ ...family, members });
  }

  async function handleSubmit() {
    if (!family || !employeeId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await submitFamilyUpdateRequest(employeeId, {
        displayName: family.displayName,
        members: family.members.map((m) => ({
          relationshipType: m.relationshipType,
          firstName: m.firstName,
          lastName: m.lastName,
          dateOfBirth: m.dateOfBirth ?? undefined,
        })),
      });
      setSuccess(
        "Family information change submitted (PENDING). HR will review before updates apply.",
      );
      setFamily(structuredClone(original));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading family information...</p>;
  }

  if (error && !family) {
    return <p className="text-sm text-red-300">{error}</p>;
  }

  if (!family) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Family Information</h1>
        <p className="text-sm text-muted">
          Household profile linked to RC account {family.rcNumber}. Changes require
          HR approval before they apply to production data.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          {success}{" "}
          <Link href="/approvals/my-requests" className="underline">
            View My Requests
          </Link>
        </p>
      ) : null}

      <Card>
        <FieldRow label="RC account number">
          <p className="font-mono text-sm">{family.rcNumber}</p>
        </FieldRow>
        <FieldRow label="Family display name">
          <ProfileInput
            readOnly={!canEdit}
            value={family.displayName}
            onChange={(e) => setFamily({ ...family, displayName: e.target.value })}
          />
        </FieldRow>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Household members</h2>
        {family.members.map((member, index) => (
          <Card key={`${member.id}-${index}`} className="space-y-3">
            <FieldRow label="Relationship">
              <ProfileSelect
                readOnly={!canEdit || member.relationshipType === "WORKER"}
                value={member.relationshipType}
                onChange={(v) =>
                  updateMember(index, {
                    relationshipType: v as FamilyRelationship,
                  })
                }
                options={RELATIONSHIP_OPTIONS}
              />
            </FieldRow>
            <FieldRow label="First name">
              <ProfileInput
                readOnly={!canEdit || member.relationshipType === "WORKER"}
                value={member.firstName}
                onChange={(e) => updateMember(index, { firstName: e.target.value })}
              />
            </FieldRow>
            <FieldRow label="Last name">
              <ProfileInput
                readOnly={!canEdit || member.relationshipType === "WORKER"}
                value={member.lastName}
                onChange={(e) => updateMember(index, { lastName: e.target.value })}
              />
            </FieldRow>
            <FieldRow label="Date of birth">
              <ProfileInput
                readOnly={!canEdit}
                type="date"
                value={member.dateOfBirth ?? ""}
                onChange={(e) =>
                  updateMember(index, {
                    dateOfBirth: e.target.value || null,
                  })
                }
              />
            </FieldRow>
          </Card>
        ))}
      </section>

      {canEdit ? (
        <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? "Submitting..." : "Submit change for approval"}
        </Button>
      ) : null}
    </div>
  );
}
