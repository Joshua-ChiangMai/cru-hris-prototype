import { SetMetadata } from '@nestjs/common';

export const CITY_ACCESS_PARAM_KEY = 'city_access_param';

/** Enforces that the route param is within the caller's city scope (HR). */
export const RequireCityAccess = (paramName = 'cityId') =>
  SetMetadata(CITY_ACCESS_PARAM_KEY, paramName);
