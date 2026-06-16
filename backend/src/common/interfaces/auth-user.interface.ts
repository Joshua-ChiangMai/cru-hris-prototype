export type ScopeLevel = 'OWN' | 'CITY' | 'ALL';

export interface AuthUser {
  userId: string;
  email: string;
  roleCodes: string[];
  permissions: string[];
  cityIds: string[];
  scopeLevel: ScopeLevel;
}
