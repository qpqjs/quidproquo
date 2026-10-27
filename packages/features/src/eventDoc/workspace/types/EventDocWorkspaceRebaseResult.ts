import { EventDocEvent } from '../../models';

/** What a rebase of a slot's pending buffer decided: the events that still apply, in order, and each one dropped with its reason. */
export type EventDocWorkspaceRebaseResult = {
  kept: EventDocEvent[];
  dropped: { event: EventDocEvent; reason: string }[];
};
