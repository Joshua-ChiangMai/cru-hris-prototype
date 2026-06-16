import type { Role } from "@/lib/rbac";

export type Session = {
  userId: string;
  email: string;
  roleCodes: Role[];
  permissions: string[];
  cityIds: string[];
  scopeLevel: "OWN" | "CITY" | "ALL";
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};
