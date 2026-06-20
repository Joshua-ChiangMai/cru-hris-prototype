import { cn } from "@/lib/cn";

const RELATIONSHIP_STYLES: Record<string, string> = {
  WORKER: "bg-blue-50 text-blue-700 border-blue-200",
  SPOUSE: "bg-purple-50 text-purple-700 border-purple-200",
  SON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DAUGHTER: "bg-teal-50 text-teal-700 border-teal-200",
  PARENT: "bg-amber-50 text-amber-700 border-amber-200",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  WORKER: "Worker",
  SPOUSE: "Spouse",
  SON: "Son",
  DAUGHTER: "Daughter",
  PARENT: "Parent",
};

type BadgeProps = {
  relationship: string;
  className?: string;
};

export function RelationshipBadge({ relationship, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        RELATIONSHIP_STYLES[relationship] ?? "bg-slate-100 text-slate-600 border-slate-200",
        className,
      )}
    >
      {RELATIONSHIP_LABELS[relationship] ?? relationship}
    </span>
  );
}
