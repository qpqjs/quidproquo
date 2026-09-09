import { QPQConfig } from 'quidproquo-core';
import { DomainTarget, qpqWebServerUtils } from 'quidproquo-webserver';

import { requireDomainResolver } from '../../appWorkspace/requireDomainResolver';

/** `resolveHosts` with the app's resolver required from the config's pointer; synth runs under ts-node, so this is sync. */
export const resolveDeployHosts = (qpqConfig: QPQConfig, target: DomainTarget): string[] =>
  qpqWebServerUtils.resolveHosts(qpqConfig, target, requireDomainResolver(qpqConfig));

/** `resolveHostForRoot` with the app's resolver. */
export const resolveDeployHostForRoot = (qpqConfig: QPQConfig, rootDomain: string, target: DomainTarget): string =>
  qpqWebServerUtils.resolveHostForRoot(qpqConfig, rootDomain, target, requireDomainResolver(qpqConfig));

/** `resolvePrimaryHost` with the app's resolver. */
export const resolveDeployPrimaryHost = (qpqConfig: QPQConfig, target: DomainTarget): string =>
  qpqWebServerUtils.resolvePrimaryHost(qpqConfig, target, requireDomainResolver(qpqConfig));
