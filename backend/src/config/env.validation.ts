/**
 * Validates required environment variables when NODE_ENV=production.
 * Invoked by ConfigModule.forRoot({ validate }) during application bootstrap.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (config.NODE_ENV !== 'production') {
    return config;
  }

  const missing: string[] = [];

  for (const key of ['JWT_SECRET', 'DATABASE_URL'] as const) {
    const value = config[key];
    if (typeof value !== 'string' || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(', ')}`,
    );
  }

  return config;
}
