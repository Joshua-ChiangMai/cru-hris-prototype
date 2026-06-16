import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return <section className={cn("rounded-lg border border-border bg-card p-5", className)}>{children}</section>;
}
