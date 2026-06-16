import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/context/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRIS P1 Prototype",
  description: "HRIS P1 Prototype aligned with the official HRIS specification",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
