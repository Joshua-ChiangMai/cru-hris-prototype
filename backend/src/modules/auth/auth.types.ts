import { RoleCode } from '@prisma/client';
import { ScopeLevel } from '../../common/interfaces/auth-user.interface';
import { PermissionKey } from '../../common/constants/permissions';

export type JwtAccessPayload = {
  sub: string;
  email: string;
  roles: RoleCode[];
  permissions: PermissionKey[];
  cityIds: string[];
  scopeLevel: ScopeLevel;
};

export type JwtRefreshPayload = {
  sub: string;
  type: 'refresh';
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type SessionResponse = {
  userId: string;
  email: string;
  roleCodes: RoleCode[];
  permissions: PermissionKey[];
  cityIds: string[];
  scopeLevel: ScopeLevel;
};
