"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-provider";
import { AuthApiError } from "@/lib/auth/api";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      const redirect = searchParams.get("redirect");
      router.replace(
        redirect && redirect.startsWith("/") ? redirect : "/dashboard"
      );
      router.refresh();
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="mb-1 text-xl font-semibold">HRIS Sign In</h1>
      <p className="mb-6 text-sm text-muted">
        Enterprise access for Staff, HR, and Admin roles.
      </p>
      <form className="space-y-4" onSubmit={onSubmit}>
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div>
          <label htmlFor="email" className="mb-1 block text-xs text-muted">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="admin@hris.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-xs text-muted">
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
        <p className="text-xs text-muted">
          Demo accounts (Password123!): admin@hris.local, hr1@hris.local,
          hr2@hris.local, hr3@hris.local, staff1@hris.local
        </p>
      </form>
    </Card>
  );
}
