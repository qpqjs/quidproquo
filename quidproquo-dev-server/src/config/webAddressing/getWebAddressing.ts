import { Nullable, QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { ApiAddress, DomainTarget, qpqWebServerUtils, WebAddressing, WebAddressingMode, WebEntryAddress } from 'quidproquo-webserver';

import { getWebEntryPlacements } from '../webEntryHosts/getWebEntryPlacements';
import { WebAddressingPorts } from './WebAddressingPorts';
import { WebAddressingResolver } from './WebAddressingResolver';

const NO_RESOLVER: WebAddressingResolver = () => undefined;

// The same targets the AWS constructs resolve, so the baked hosts are the deployed ones.
const getWebEntryTarget = (qpqConfig: QPQConfig, subDomainName: Nullable<string>, onRootDomain: boolean): DomainTarget => ({
  subdomain: subDomainName ?? undefined,
  service: onRootDomain ? undefined : qpqCoreUtils.getApplicationModuleName(qpqConfig),
});

const getApiAddresses = (qpqConfigs: QPQConfig[], resolve: WebAddressingResolver): ApiAddress[] =>
  qpqConfigs.flatMap((qpqConfig) =>
    qpqWebServerUtils.getApiConfigs(qpqConfig).map((api) => ({
      service: qpqCoreUtils.getApplicationModuleName(qpqConfig),
      apiSubdomain: api.apiSubdomain,
      hosts: qpqWebServerUtils.resolveHosts(qpqConfig, { subdomain: api.apiSubdomain }, resolve(qpqConfig)),
    })),
  );

const getWebSocketAddresses = (qpqConfigs: QPQConfig[], resolve: WebAddressingResolver): ApiAddress[] =>
  qpqConfigs.flatMap((qpqConfig) =>
    qpqWebServerUtils.getWebsocketSettings(qpqConfig).map((webSocket) => ({
      service: qpqCoreUtils.getApplicationModuleName(qpqConfig),
      apiSubdomain: webSocket.apiSubdomain,
      hosts: qpqWebServerUtils.resolveHosts(
        qpqConfig,
        getWebEntryTarget(qpqConfig, webSocket.apiSubdomain, webSocket.onRootDomain),
        resolve(qpqConfig),
      ),
    })),
  );

/**
 * The addressing to bake into a views build. Port mode with the given host-side ports when
 * `ports` is set (dev server, docker); otherwise subdomain mode, with every host resolved
 * through the app's domain resolver exactly as the deploy resolves it, one per root domain.
 */
export const getWebAddressing = (
  qpqConfigs: QPQConfig[],
  ports: Nullable<WebAddressingPorts>,
  resolve: WebAddressingResolver = NO_RESOLVER,
): WebAddressing => {
  const { hosts, routes } = getWebEntryPlacements(qpqConfigs);
  const configByService = new Map(qpqConfigs.map((qpqConfig) => [qpqCoreUtils.getApplicationModuleName(qpqConfig), qpqConfig]));

  const resolveEntryHosts = (service: string, subDomainName: Nullable<string>, onRootDomain: boolean): string[] => {
    const qpqConfig = configByService.get(service)!;
    return ports ? [] : qpqWebServerUtils.resolveHosts(qpqConfig, getWebEntryTarget(qpqConfig, subDomainName, onRootDomain), resolve(qpqConfig));
  };

  const entries: WebEntryAddress[] = [
    ...routes.map((route) => ({
      service: route.service,
      name: route.entryName,
      hosts: resolveEntryHosts(route.service, route.webEntry.domain.subDomainName ?? null, route.webEntry.domain.onRootDomain),
      port: null,
      path: route.path,
    })),
    ...hosts.map((host) => ({
      service: host.service,
      name: host.entryName,
      hosts: resolveEntryHosts(host.service, host.webEntry.domain.subDomainName ?? null, host.webEntry.domain.onRootDomain),
      port: ports ? ports.mapHostPort(host.port) : null,
      path: host.webEntry.domain.subDomainName ? `/${host.webEntry.domain.subDomainName}` : '/',
    })),
  ];

  if (ports) {
    return {
      mode: WebAddressingMode.port,
      apiPort: ports.mapHostPort(ports.api),
      webSocketPort: ports.mapHostPort(ports.webSocket),
      entries,
    };
  }

  // Every service declares the same roots (they come from one deployment setting); the first
  // service with a domain speaks for the app.
  const rootDomains = qpqConfigs.map((qpqConfig) => qpqWebServerUtils.getRootDomains(qpqConfig)).find((roots) => roots.length > 0) ?? [];

  return {
    mode: WebAddressingMode.subdomain,
    rootDomains,
    entries,
    apis: getApiAddresses(qpqConfigs, resolve),
    webSockets: getWebSocketAddresses(qpqConfigs, resolve),
  };
};
