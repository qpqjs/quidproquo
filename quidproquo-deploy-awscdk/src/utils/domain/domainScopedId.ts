import { QPQConfig } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

/**
 * Construct id for a per-root resource. The primary root keeps the bare id, so existing
 * single-root deployments keep their CloudFormation logical ids; extra roots get a suffix.
 * Reordering the root list therefore rebuilds these resources.
 */
export const domainScopedId = (qpqConfig: QPQConfig, baseId: string, rootDomain: string): string => {
  const isPrimary = qpqWebServerUtils.getPrimaryRootDomain(qpqConfig) === rootDomain;

  return isPrimary ? baseId : `${baseId}-${rootDomain.replace(/[^a-zA-Z0-9]/g, '-')}`;
};
