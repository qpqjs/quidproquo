import { qpqWebServerUtils } from 'quidproquo-webserver';

import { DevUserDirectory } from './devAuth';
import { getDevUserByUserId, upsertDevUser } from './jsonUserStore';

/**
 * Self-heal the dev user store from an accepted token. A browser can restore a persisted
 * session without logging in, and a reseed wipes the store only a login writes to, so the
 * token's user would otherwise be unresolvable (an "unknown account" in every roster)
 * until the next login. Dev tokens carry the email, so the entry can be recreated here.
 */
export const ensureDevUserFromAccessToken = async (runtimePath: string, userDirectory: DevUserDirectory, accessToken: string): Promise<void> => {
  const payload = qpqWebServerUtils.unsafeDecodeJWTPayload<{ sub?: string; email?: string; username?: string }>(accessToken);
  const email = payload?.email || payload?.username;

  if (!payload?.sub || !email) {
    return;
  }

  const existing = await getDevUserByUserId(runtimePath, userDirectory, payload.sub);
  if (!existing) {
    await upsertDevUser(runtimePath, userDirectory, email);
  }
};
