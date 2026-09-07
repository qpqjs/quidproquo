import { EventDocLink } from '../../models';

/**
 * A doc type's outbound references, read off its folded view. Pure and synchronous. A leaf doc type declares none
 * rather than an empty collector.
 */
export type EventDocReferenceCollector<TView> = (view: TView) => EventDocLink[];
