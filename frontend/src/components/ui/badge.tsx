import { cn } from "@/lib/cn";

const RELATIONSHIP_STYLES: Record<string, string> = {
  WORKER: "bg-blue-950/60 text-blue-200 border-blue-800",
  SPOUSE: "bg-purple-950/60 text-purple-200 border-purple-800",
  SON: "bg-emerald-950/60 text-emerald-200 border-emerald-800",
  DAUGHTER: "bg-teal-950/60 text-teal-200 border-teal-800",
  PARENT: "bg-amber-950/60 text-amber-200 border-amber-800",
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
        RELATIONSHIP_STYLES[relationship] ?? "bg-slate-800 text-slate-200 border-slate-600",
        className,
      )}
    >
      {RELATIONSHIP_LABELS[relationship] ?? relationship}
    </span>
  );
}
