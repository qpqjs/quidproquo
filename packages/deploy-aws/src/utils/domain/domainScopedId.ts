import { QPQConfig } from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';

/**
 * Construct id for a per-root resource: the base id suffixed with the root, so a root's
 * CloudFormation logical ids never depend on where it sits in the root list. Roots can be
 * reordered, added and removed without a resource moving to another id.
 *
 * The one exception is the app's `legacyUnsuffixedRootDomain`, which keeps the bare id it was
 * first deployed under. TODO: remove that exception for version 1 of quidproquo.
 */
export const domainScopedId = (qpqConfig: QPQConfig, baseId: string, rootDomain: string): string => {
  const isLegacyUnsuffixed = qpqWebServerUtils.getLegacyUnsuffixedRootDomain(qpqConfig) === rootDomain;

  return isLegacyUnsuffixed ? baseId : `${baseId}-${rootDomain.replace(/[^a-zA-Z0-9]/g, '-')}`;
};
