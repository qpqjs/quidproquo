import { DomainTarget } from '../../../domain/types/DomainTarget';

/** Stable identity for a target, so lists of targets can be deduplicated. */
export const getDomainTargetKey = (target: DomainTarget): string => `${target.subdomain ?? ''}::${target.service ?? ''}`;
