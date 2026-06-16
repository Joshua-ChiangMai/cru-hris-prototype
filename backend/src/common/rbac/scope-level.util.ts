import { ScopeLevel } from '../interfaces/auth-user.interface';

const SCOPE_RANK: Record<ScopeLevel, number> = {
  OWN: 1,
  CITY: 2,
  ALL: 3,
};

export function resolveScopeLevelFromRoles(roleCodes: string[]): ScopeLevel {
  if (roleCodes.includes('ADMIN')) {
    return 'ALL';
  }
  if (roleCodes.includes('HR')) {
    return 'CITY';
  }
  return 'OWN';
}

export function hasScopeLevel(
  userScope: ScopeLevel,
  allowedScopes: ScopeLevel[],
): boolean {
  return allowedScopes.includes(userScope);
}

export function meetsMinimumScope(
  userScope: ScopeLevel,
  minimumScope: ScopeLevel,
): boolean {
  return SCOPE_RANK[userScope] >= SCOPE_RANK[minimumScope];
}
