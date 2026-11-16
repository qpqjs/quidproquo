import { createEventDocInitialDocumentState } from '../../fold/createEventDocInitialDocumentState';
import { EventDocSummaryView } from '../../models';

/**
 * Where the summary view starts: the base document fields every view carries, plus the summary's own. INIT_STATE
 * overlays the real identity. No `type`: that is the lists store's partition key, stamped at persistence rather than
 * folded from any event.
 */
export const createEventDocSummarySeed = (): EventDocSummaryView => ({
  ...createEventDocInitialDocumentState(1),
  createdBy: '',
  updatedBy: '',
  versions: [],
  // Nothing folded yet; INIT_STATE is event 0.
  eventId: -1,
});
