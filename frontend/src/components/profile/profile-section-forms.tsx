"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FieldRow,
  ProfileInput,
  ProfileSelect,
} from "@/components/profile/profile-fields";
import type {
  EmployeeProfile,
  ProfileSectionId,
  UpdateProfilePayload,
} from "@/lib/profile/types";

type SectionFormProps = {
  profile: EmployeeProfile;
  readOnly: boolean;
  onChange: (next: EmployeeProfile) => void;
};

function emptyTeamRow() {
  return {
    id: "",
    team: "",
    position: "",
    startDate: "",
    endDate: null as string | null,
    isPrimary: false,
  };
}

function emptyEducationRow() {
  return {
    id: "",
    degree: "",
    major: null as string | null,
    school: "",
    graduationYear: null as number | null,
    notes: null as string | null,
  };
}

function emptyLanguageRow() {
  return { id: "", language: "", proficiency: "CONVERSATIONAL" as const };
}

function emptyPassportRow() {
  return {
    id: "",
    passportNumber: "",
    country: "",
    issueDate: null as string | null,
    expiryDate: null as string | null,
  };
}

function emptyInsuranceRow() {
  return {
    id: "",
    insuranceProvider: "",
    policyNumber: "",
    effectiveDate: null as string | null,
  };
}

export function BasicSectionForm({ profile, readOnly, onChange }: SectionFormProps) {
  const b = profile.basic;
  const set = (patch: Partial<typeof b>) =>
    onChange({ ...profile, basic: { ...b, ...patch } });

  return (
    <div className="space-y-3">
      <FieldRow label="First name">
        <ProfileInput readOnly={readOnly} value={b.firstName} onChange={(e) => set({ firstName: e.target.value })} />
      </FieldRow>
      <FieldRow label="Last name">
        <ProfileInput readOnly={readOnly} value={b.lastName} onChange={(e) => set({ lastName: e.target.value })} />
      </FieldRow>
      <FieldRow label="Preferred name">
        <ProfileInput readOnly={readOnly} value={b.preferredName ?? ""} onChange={(e) => set({ preferredName: e.target.value || null })} />
      </FieldRow>
      <FieldRow label="Date of birth">
        <ProfileInput readOnly={readOnly} type="date" value={b.dateOfBirth ?? ""} onChange={(e) => set({ dateOfBirth: e.target.value || null })} />
      </FieldRow>
      <FieldRow label="Gender">
        <ProfileSelect readOnly={readOnly} value={b.gender ?? ""} onChange={(v) => set({ gender: (v || null) as typeof b.gender })} options={[
          { value: "MALE", label: "Male" },
          { value: "FEMALE", label: "Female" },
          { value: "NON_BINARY", label: "Non-binary" },
          { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
        ]} />
      </FieldRow>
      <FieldRow label="Marital status">
        <ProfileSelect readOnly={readOnly} value={b.maritalStatus ?? ""} onChange={(v) => set({ maritalStatus: (v || null) as typeof b.maritalStatus })} options={[
          { value: "SINGLE", label: "Single" },
          { value: "MARRIED", label: "Married" },
          { value: "DIVORCED", label: "Divorced" },
          { value: "WIDOWED", label: "Widowed" },
          { value: "DOMESTIC_PARTNERSHIP", label: "Domestic partnership" },
        ]} />
      </FieldRow>
      <FieldRow label="Citizenship">
        <ProfileInput readOnly={readOnly} value={b.citizenship ?? ""} onChange={(e) => set({ citizenship: e.target.value || null })} />
      </FieldRow>
      <FieldRow label="RC number">
        <ProfileInput readOnly={readOnly} value={b.rcNumber ?? ""} onChange={(e) => set({ rcNumber: e.target.value || null })} />
      </FieldRow>
    </div>
  );
}

export function ContactSectionForm({ profile, readOnly, onChange }: SectionFormProps) {
  const c = profile.contact;
  const set = (patch: Partial<typeof c>) =>
    onChange({ ...profile, contact: { ...c, ...patch } });

  const fields: Array<[string, keyof typeof c]> = [
    ["Primary address line 1", "primaryAddressLine1"],
    ["Primary address line 2", "primaryAddressLine2"],
    ["Primary city", "primaryCity"],
    ["Primary state", "primaryState"],
    ["Primary postal code", "primaryPostalCode"],
    ["Primary country", "primaryCountry"],
    ["Mailing address line 1", "mailingAddressLine1"],
    ["Mailing address line 2", "mailingAddressLine2"],
    ["Mailing city", "mailingCity"],
    ["Mailing state", "mailingState"],
    ["Mailing postal code", "mailingPostalCode"],
    ["Mailing country", "mailingCountry"],
    ["Phone (primary)", "phonePrimary"],
    ["Phone (secondary)", "phoneSecondary"],
    ["Email (primary)", "emailPrimary"],
    ["Email (secondary)", "emailSecondary"],
    ["Signal account", "signalAccount"],
  ];

  return (
    <div className="space-y-3">
      {fields.map(([label, key]) => (
        <FieldRow key={key} label={label}>
          <ProfileInput
            readOnly={readOnly}
            value={c[key] ?? ""}
            onChange={(e) => set({ [key]: e.target.value || null } as Partial<typeof c>)}
          />
        </FieldRow>
      ))}
    </div>
  );
}

export function WorkerSectionForm({ profile, readOnly, onChange }: SectionFormProps) {
  const w = profile.worker;
  const set = (patch: Partial<typeof w>) =>
    onChange({ ...profile, worker: { ...w, ...patch } });

  return (
    <div className="space-y-3">
      <FieldRow label="Worker type">
        <ProfileSelect readOnly={readOnly} value={w.workerType ?? ""} onChange={(v) => set({ workerType: (v || null) as typeof w.workerType })} options={[
          { value: "FULL_TIME", label: "Full time" },
          { value: "PART_TIME", label: "Part time" },
          { value: "INTERN", label: "Intern" },
          { value: "VOLUNTEER", label: "Volunteer" },
          { value: "CONTRACT", label: "Contract" },
        ]} />
      </FieldRow>
      <FieldRow label="Worker status">
        <ProfileSelect readOnly={readOnly} value={w.workerStatus ?? ""} onChange={(v) => set({ workerStatus: (v || null) as typeof w.workerStatus })} options={[
          { value: "ACTIVE", label: "Active" },
          { value: "ON_LEAVE", label: "On leave" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "TERMINATED", label: "Terminated" },
        ]} />
      </FieldRow>
      <FieldRow label="Intern start date">
        <ProfileInput readOnly={readOnly} type="date" value={w.internStartDate ?? ""} onChange={(e) => set({ internStartDate: e.target.value || null })} />
      </FieldRow>
      <FieldRow label="Ministry join date">
        <ProfileInput readOnly={readOnly} type="date" value={w.ministryJoinDate ?? ""} onChange={(e) => set({ ministryJoinDate: e.target.value || null })} />
      </FieldRow>
      <FieldRow label="Worker join date">
        <ProfileInput readOnly={readOnly} type="date" value={w.workerJoinDate ?? ""} onChange={(e) => set({ workerJoinDate: e.target.value || null })} />
      </FieldRow>
      <FieldRow label="Termination date">
        <ProfileInput readOnly={readOnly} type="date" value={w.terminationDate ?? ""} onChange={(e) => set({ terminationDate: e.target.value || null })} />
      </FieldRow>
      <FieldRow label="Sending region">
        <ProfileInput readOnly={readOnly} value={w.sendingRegion ?? ""} onChange={(e) => set({ sendingRegion: e.target.value || null })} />
      </FieldRow>
      <FieldRow label="Salary source">
        <ProfileInput readOnly={readOnly} value={w.salarySource ?? ""} onChange={(e) => set({ salarySource: e.target.value || null })} />
      </FieldRow>
    </div>
  );
}

function ListSectionCard({
  title,
  readOnly,
  onAdd,
  children,
}: {
  title: string;
  readOnly: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {!readOnly && (
          <Button type="button" variant="outline" onClick={onAdd}>
            Add
          </Button>
        )}
      </div>
      {children}
    </Card>
  );
}

export function TeamSectionForm({ profile, readOnly, onChange }: SectionFormProps) {
  const rows = profile.teamAssignments;
  return (
    <div className="space-y-4">
      <ListSectionCard
        title="Assignments"
        readOnly={readOnly}
        onAdd={() =>
          onChange({
            ...profile,
            teamAssignments: [...rows, emptyTeamRow()],
          })
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No team assignments recorded.</p>
        ) : (
          rows.map((row, index) => (
            <div key={index} className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0">
              <FieldRow label="Team">
                <ProfileInput readOnly={readOnly} value={row.team} onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, team: e.target.value };
                  onChange({ ...profile, teamAssignments: next });
                }} />
              </FieldRow>
              <FieldRow label="Position">
                <ProfileInput readOnly={readOnly} value={row.position} onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, position: e.target.value };
                  onChange({ ...profile, teamAssignments: next });
                }} />
              </FieldRow>
              <FieldRow label="Start date">
                <ProfileInput readOnly={readOnly} type="date" value={row.startDate} onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, startDate: e.target.value };
                  onChange({ ...profile, teamAssignments: next });
                }} />
              </FieldRow>
              <FieldRow label="End date">
                <ProfileInput readOnly={readOnly} type="date" value={row.endDate ?? ""} onChange={(e) => {
                  const next = [...rows];
                  next[index] = { ...row, endDate: e.target.value || null };
                  onChange({ ...profile, teamAssignments: next });
                }} />
              </FieldRow>
              <FieldRow label="Primary assignment">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={row.isPrimary}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = { ...row, isPrimary: e.target.checked };
                    onChange({ ...profile, teamAssignments: next });
                  }}
                />
              </FieldRow>
            </div>
          ))
        )}
      </ListSectionCard>
    </div>
  );
}

export function EducationSectionForm({ profile, readOnly, onChange }: SectionFormProps) {
  const rows = profile.education;
  return (
    <ListSectionCard
      title="Education"
      readOnly={readOnly}
      onAdd={() => onChange({ ...profile, education: [...rows, emptyEducationRow()] })}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No education records.</p>
      ) : (
        rows.map((row, index) => (
          <div key={index} className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0">
            <FieldRow label="Degree">
              <ProfileInput readOnly={readOnly} value={row.degree} onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, degree: e.target.value };
                onChange({ ...profile, education: next });
              }} />
            </FieldRow>
            <FieldRow label="Major">
              <ProfileInput readOnly={readOnly} value={row.major ?? ""} onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, major: e.target.value || null };
                onChange({ ...profile, education: next });
              }} />
            </FieldRow>
            <FieldRow label="School">
              <ProfileInput readOnly={readOnly} value={row.school} onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, school: e.target.value };
                onChange({ ...profile, education: next });
              }} />
            </FieldRow>
            <FieldRow label="Graduation year">
              <ProfileInput readOnly={readOnly} type="number" value={row.graduationYear?.toString() ?? ""} onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, graduationYear: e.target.value ? Number(e.target.value) : null };
                onChange({ ...profile, education: next });
              }} />
            </FieldRow>
            <FieldRow label="Notes">
              <ProfileInput readOnly={readOnly} value={row.notes ?? ""} onChange={(e) => {
                const next = [...rows];
                next[index] = { ...row, notes: e.target.value || null };
                onChange({ ...profile, education: next });
              }} />
            </FieldRow>
          </div>
        ))
      )}
    </ListSectionCard>
  );
}

export function LanguagesSectionForm({ profile, readOnly, onChange }: SectionFormProps) {
  const rows = profile.languages;
  return (
    <ListSectionCard
      title="Languages"
      readOnly={readOnly}
      onAdd={() => onChange({ ...profile, languages: [...rows, emptyLanguageRow()] })}
    >
      {rows.map((row, index) => (
        <div key={index} className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0">
          <FieldRow label="Language">
            <ProfileInput readOnly={readOnly} value={row.language} onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, language: e.target.value };
              onChange({ ...profile, languages: next });
            }} />
          </FieldRow>
          <FieldRow label="Proficiency">
            <ProfileSelect readOnly={readOnly} value={row.proficiency} onChange={(v) => {
              const next = [...rows];
              next[index] = { ...row, proficiency: v as typeof row.proficiency };
              onChange({ ...profile, languages: next });
            }} options={[
              { value: "BASIC", label: "Basic" },
              { value: "CONVERSATIONAL", label: "Conversational" },
              { value: "FLUENT", label: "Fluent" },
              { value: "NATIVE", label: "Native" },
            ]} />
          </FieldRow>
        </div>
      ))}
    </ListSectionCard>
  );
}

export function PassportSectionForm({ profile, readOnly, onChange }: SectionFormProps) {
  const rows = profile.passports;
  return (
    <ListSectionCard
      title="Passports"
      readOnly={readOnly}
      onAdd={() => onChange({ ...profile, passports: [...rows, emptyPassportRow()] })}
    >
      {rows.map((row, index) => (
        <div key={index} className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0">
          <FieldRow label="Passport number">
            <ProfileInput readOnly={readOnly} value={row.passportNumber} onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, passportNumber: e.target.value };
              onChange({ ...profile, passports: next });
            }} />
          </FieldRow>
          <FieldRow label="Country">
            <ProfileInput readOnly={readOnly} value={row.country} onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, country: e.target.value };
              onChange({ ...profile, passports: next });
            }} />
          </FieldRow>
          <FieldRow label="Issue date">
            <ProfileInput readOnly={readOnly} type="date" value={row.issueDate ?? ""} onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, issueDate: e.target.value || null };
              onChange({ ...profile, passports: next });
            }} />
          </FieldRow>
          <FieldRow label="Expiry date">
            <ProfileInput readOnly={readOnly} type="date" value={row.expiryDate ?? ""} onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, expiryDate: e.target.value || null };
              onChange({ ...profile, passports: next });
            }} />
          </FieldRow>
        </div>
      ))}
    </ListSectionCard>
  );
}

export function InsuranceSectionForm({ profile, readOnly, onChange }: SectionFormProps) {
  const rows = profile.insurance;
  return (
    <ListSectionCard
      title="Insurance policies"
      readOnly={readOnly}
      onAdd={() => onChange({ ...profile, insurance: [...rows, emptyInsuranceRow()] })}
    >
      {rows.map((row, index) => (
        <div key={index} className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0">
          <FieldRow label="Provider">
            <ProfileInput readOnly={readOnly} value={row.insuranceProvider} onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, insuranceProvider: e.target.value };
              onChange({ ...profile, insurance: next });
            }} />
          </FieldRow>
          <FieldRow label="Policy number">
            <ProfileInput readOnly={readOnly} value={row.policyNumber} onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, policyNumber: e.target.value };
              onChange({ ...profile, insurance: next });
            }} />
          </FieldRow>
          <FieldRow label="Effective date">
            <ProfileInput readOnly={readOnly} type="date" value={row.effectiveDate ?? ""} onChange={(e) => {
              const next = [...rows];
              next[index] = { ...row, effectiveDate: e.target.value || null };
              onChange({ ...profile, insurance: next });
            }} />
          </FieldRow>
        </div>
      ))}
    </ListSectionCard>
  );
}

export function buildSectionPayload(
  section: ProfileSectionId,
  profile: EmployeeProfile,
): UpdateProfilePayload {
  switch (section) {
    case "basic":
      return { basic: profile.basic };
    case "contact":
      return { contact: profile.contact };
    case "worker":
      return { worker: profile.worker };
    case "team":
      return {
        teamAssignments: profile.teamAssignments.map(({ id: _id, ...row }) => row),
      };
    case "education":
      return {
        education: profile.education.map(({ id: _id, ...row }) => row),
      };
    case "languages":
      return {
        languages: profile.languages.map(({ id: _id, ...row }) => row),
      };
    case "passport":
      return {
        passports: profile.passports.map(({ id: _id, ...row }) => row),
      };
    case "insurance":
      return {
        insurance: profile.insurance.map(({ id: _id, ...row }) => row),
      };
    default:
      return {};
  }
}

export function renderProfileSection(
  section: ProfileSectionId,
  props: SectionFormProps,
) {
  switch (section) {
    case "basic":
      return <BasicSectionForm {...props} />;
    case "contact":
      return <ContactSectionForm {...props} />;
    case "worker":
      return <WorkerSectionForm {...props} />;
    case "team":
      return <TeamSectionForm {...props} />;
    case "education":
      return <EducationSectionForm {...props} />;
    case "languages":
      return <LanguagesSectionForm {...props} />;
    case "passport":
      return <PassportSectionForm {...props} />;
    case "insurance":
      return <InsuranceSectionForm {...props} />;
    default:
      return null;
  }
}
