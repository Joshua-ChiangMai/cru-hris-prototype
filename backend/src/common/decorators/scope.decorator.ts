import { SetMetadata } from '@nestjs/common';
import { ScopeLevel } from '../interfaces/auth-user.interface';

export const SCOPE_METADATA_KEY = 'required_scopes';

/** User scope must match one of the listed levels (OWN, CITY, ALL). */
export const RequireScope = (...scopes: ScopeLevel[]) =>
  SetMetadata(SCOPE_METADATA_KEY, scopes);
