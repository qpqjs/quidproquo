import { Nullable } from 'quidproquo';

import { readFileSync } from 'node:fs';

/** Credentials and region as the SDK's config options take them. */
export type ParentAwsCredentials = {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
};

// The sandbox child has every AWS_* variable stripped, but it runs as the same OS user as the
// runner handler, so on Linux it can read the parent's environment from /proc. This is the
// worst case a hostile script can manage, and what the lockdown test signs its calls with.
export const readParentCredentials = (): Nullable<ParentAwsCredentials> => {
  let environ: string;
  try {
    environ = readFileSync(`/proc/${process.ppid}/environ`, 'utf8');
  } catch {
    return null;
  }

  const env = new Map<string, string>();
  for (const entry of environ.split('\0')) {
    const separator = entry.indexOf('=');
    if (separator > 0) {
      env.set(entry.slice(0, separator), entry.slice(separator + 1));
    }
  }

  const accessKeyId = env.get('AWS_ACCESS_KEY_ID');
  const secretAccessKey = env.get('AWS_SECRET_ACCESS_KEY');
  const region = env.get('AWS_REGION') ?? env.get('AWS_DEFAULT_REGION');
  if (!accessKeyId || !secretAccessKey || !region) {
    return null;
  }

  return {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
      sessionToken: env.get('AWS_SESSION_TOKEN'),
    },
  };
};
