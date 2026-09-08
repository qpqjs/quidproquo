import { Nullable, QPQConfig } from 'quidproquo-core';

import { getRootDomains } from './getRootDomains';

/** The first declared root, which absolute URLs (email links, MF remotes, the Cognito domain) bake to; null without a domain. */
export const getPrimaryRootDomain = (qpqConfig: QPQConfig): Nullable<string> => getRootDomains(qpqConfig)[0] ?? null;
