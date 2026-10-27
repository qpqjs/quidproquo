import { CoalesceEventType } from './CoalesceEventType';

/** 'all' coalesces every type last-write-wins (the local-slot default); a list applies only those rules and unlisted types append. */
export type EventDocWorkspaceCoalesceRules = CoalesceEventType[] | 'all';
