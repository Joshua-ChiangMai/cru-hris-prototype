"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RelationshipBadge } from "@/components/ui/badge";
import { fetchFamilies, fetchFamilyById, fetchMyFamily } from "@/lib/family/api";
import type { FamilyDetail, FamilySummary } from "@/lib/family/types";
import { useAuth } from "@/context/auth-provider";
import { cn } from "@/lib/cn";

function FamilySummaryCard({
  family,
  selected,
  onSelect,
}: {
  family: FamilySummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const workerName = family.worker
    ? `${family.worker.firstName} ${family.worker.lastName}`
    : "—";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-slate-600",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        RC Account
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">
        {family.rcNumber}
      </p>
      <p className="mt-2 text-sm font-medium">{family.displayName}</p>
      <p className="mt-1 text-xs text-muted">Worker: {workerName}</p>
      {family.spouseIsEmployee && family.employeeSpouse ? (
        <p className="mt-1 text-xs text-emerald-300">
          Spouse employee: {family.employeeSpouse.fullName}
          {family.employeeSpouse.employeeNo
            ? ` (${family.employeeSpouse.employeeNo})`
            : ""}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{family.memberCount} members</span>
        {family.worker?.city && (
          <span>
            {family.worker.city.name} ({family.worker.city.code})
          </span>
        )}
      </div>
    </button>
  );
}

function FamilyMemberCard({
  member,
  rcNumber,
}: {
  member: FamilyDetail["members"][number];
  rcNumber: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{member.fullName}</h3>
          {member.dateOfBirth && (
            <p className="text-xs text-muted">Born {member.dateOfBirth}</p>
          )}
        </div>
        <RelationshipBadge relationship={member.relationshipType} />
      </div>
      <div className="rounded-md border border-border/60 bg-background/50 px-3 py-2">
        <p className="text-xs text-muted">Shared RC account</p>
        <p className="font-mono text-sm font-medium">{rcNumber}</p>
      </div>
      {member.employeeNo && (
        <dl className="grid gap-1 text-xs text-muted">
          <div className="flex justify-between gap-2">
            <dt>Employee no.</dt>
            <dd className="font-mono text-foreground">{member.employeeNo}</dd>
          </div>
          {member.jobTitle && (
            <div className="flex justify-between gap-2">
              <dt>Role</dt>
              <dd className="text-foreground">{member.jobTitle}</dd>
            </div>
          )}
          {member.department && (
            <div className="flex justify-between gap-2">
              <dt>Department</dt>
              <dd className="text-foreground">{member.department}</dd>
            </div>
          )}
        </dl>
      )}
    </Card>
  );
}

function RelationshipSummary({
  relationships,
}: {
  relationships: FamilyDetail["relationships"];
}) {
  const entries = Object.entries(relationships).filter(([, count]) => count > 0);

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([type, count]) => (
        <span
          key={type}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2 py-1 text-xs"
        >
          <RelationshipBadge relationship={type} />
          <span className="text-muted">×{count}</span>
        </span>
      ))}
    </div>
  );
}

function FamilyDetailPanel({ family }: { family: FamilyDetail }) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Family account
            </p>
            <h2 className="mt-1 text-xl font-semibold">{family.displayName}</h2>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-primary">
              {family.rcNumber}
            </p>
            <p className="mt-2 text-sm text-muted">
              Religious Congregation (RC) account shared by all household members
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-muted">Total members</p>
            <p className="text-2xl font-semibold">{family.memberCount}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs text-muted">Relationship breakdown</p>
          <RelationshipSummary relationships={family.relationships} />
        </div>
      </Card>

      <section>
        <h3 className="mb-3 text-base font-medium">Family members</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {family.members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              rcNumber={family.rcNumber}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export function FamilyMembersPage() {
  const { session } = useAuth();
  const isOwnScope = session?.scopeLevel === "OWN";
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FamilyDetail | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async (familyId: string) => {
    setDetailLoading(true);
    try {
      const data = await fetchFamilyById(familyId);
      setDetail(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load family");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (isOwnScope) {
          const myFamily = await fetchMyFamily();
          if (!cancelled) {
            setFamilies([myFamily]);
            setSelectedId(myFamily.id);
            setDetail(myFamily);
            setError(null);
          }
        } else {
          const result = await fetchFamilies({
            search: searchInput.trim() || undefined,
            limit: 50,
          });
          if (!cancelled) {
            setFamilies(result.data);
            if (result.data.length > 0) {
              const firstId = result.data[0].id;
              setSelectedId(firstId);
              const data = await fetchFamilyById(firstId);
              if (!cancelled) {
                setDetail(data);
              }
            } else {
              setSelectedId(null);
              setDetail(null);
            }
            setError(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load families");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [session, isOwnScope, searchInput]);

  const handleSelectFamily = (id: string) => {
    setSelectedId(id);
    void loadDetail(id);
  };

  if (loading) {
    return (
      <p className="text-sm text-muted">Loading family records...</p>
    );
  }

  if (error && !detail) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Family Members</h1>
        <p className="text-sm text-muted">
          {isOwnScope
            ? "Your household RC account and registered family members"
            : "RC household accounts and dependents within your access scope"}
        </p>
      </header>

      {!isOwnScope && (
        <div className="max-w-md">
          <Input
            placeholder="Search RC number, family name, or member…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      )}

      {families.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No family records found in your scope.</p>
        </Card>
      ) : (
        <div
          className={cn(
            "grid gap-6",
            !isOwnScope && "lg:grid-cols-[280px_1fr]",
          )}
        >
          {!isOwnScope && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted">Families</h2>
              <div className="space-y-2">
                {families.map((family) => (
                  <FamilySummaryCard
                    key={family.id}
                    family={family}
                    selected={selectedId === family.id}
                    onSelect={() => handleSelectFamily(family.id)}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            {detailLoading && (
              <p className="mb-4 text-sm text-muted">Loading family details…</p>
            )}
            {detail && <FamilyDetailPanel family={detail} />}
          </section>
        </div>
      )}
    </div>
  );
}
