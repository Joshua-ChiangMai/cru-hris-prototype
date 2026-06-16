import { Suspense } from "react";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
