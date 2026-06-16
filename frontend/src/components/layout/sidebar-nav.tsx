"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Session } from "@/lib/auth/types";
import { getNavSectionsForSession } from "@/lib/rbac";

type SidebarNavProps = {
  session: Session;
};

export function SidebarNav({ session }: SidebarNavProps) {
  const pathname = usePathname();
  const sections = getNavSectionsForSession(session);

  return (
    <nav className="space-y-5">
      {sections.map((section) => (
        <div key={section.title ?? "default"}>
          {section.title && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
              {section.title}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primaryForeground"
                      : "text-muted hover:bg-slate-800 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
