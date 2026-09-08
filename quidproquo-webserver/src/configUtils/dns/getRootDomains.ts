import { QPQConfig } from 'quidproquo-core';

import { getDnsConfig } from './getDnsConfig';

/** Declared roots, primary first; empty when the service has no domain. */
export const getRootDomains = (qpqConfig: QPQConfig): string[] => getDnsConfig(qpqConfig)?.rootDomains ?? [];
