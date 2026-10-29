import { createActionRequester } from '@qpqjs/core';

import { DomainTarget } from '../../domain/types/DomainTarget';
import { DnsActionType } from './DnsActionType';

/** Hosts for a target on every root, primary first. Only targets declared in config resolve; others throw. */
export const askDnsResolveHosts = createActionRequester<string[]>()({
  actionType: DnsActionType.ResolveHosts,
  getPayload: (target: DomainTarget = {}) => target,
});
