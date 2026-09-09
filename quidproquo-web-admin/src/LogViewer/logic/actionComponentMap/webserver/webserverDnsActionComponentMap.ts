import { DnsActionType } from 'quidproquo-webserver';

const webserverDnsActionComponentMap: Record<string, string[]> = {
  [DnsActionType.List]: ['askDnsList'],
  [DnsActionType.ResolveHosts]: ['askDnsResolveHosts'],
};

export default webserverDnsActionComponentMap;
