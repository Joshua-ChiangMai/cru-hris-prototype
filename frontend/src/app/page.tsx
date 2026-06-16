import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">HRIS P1 Prototype</h1>
        <p className="mt-2 text-sm text-muted">Continue to the login page.</p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primaryForeground"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}
