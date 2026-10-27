import { Action, createActionRequester } from 'quidproquo-core';

import { DomainTarget } from '../../domain/types/DomainTarget';
import { DnsActionType } from './DnsActionType';

export interface DnsResolveHostsAction extends Action<DomainTarget> {
  type: DnsActionType.ResolveHosts;
  payload: DomainTarget;
}

/** Hosts for a target on every root, primary first. Only targets declared in config resolve; others throw. */
export const askDnsResolveHosts = createActionRequester<string[]>()({
  actionType: DnsActionType.ResolveHosts,
  getPayload: (target: DomainTarget = {}) => target,
});
