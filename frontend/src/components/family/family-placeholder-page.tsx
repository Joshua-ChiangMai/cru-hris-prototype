"use client";

import { Card } from "@/components/ui/card";

type FamilyPlaceholderPageProps = {
  title: string;
  description: string;
};

export function FamilyPlaceholderPage({
  title,
  description,
}: FamilyPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </header>
      <Card>
        <p className="text-sm text-muted">
          This section is part of the official HRIS family module navigation.
          Detailed forms and data capture for this area will be delivered in a
          subsequent specification phase.
        </p>
      </Card>
    </div>
  );
}
