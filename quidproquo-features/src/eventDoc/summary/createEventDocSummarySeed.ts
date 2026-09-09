import { EventDocSummaryView } from '../models';

/**
 * Where the summary starts; INIT_STATE overlays the real identity. No `type`: that is the summary store's partition
 * key, stamped at persistence rather than folded from any event.
 */
export const createEventDocSummarySeed = (): EventDocSummaryView => ({
  id: 'NO_INIT',
  code: 'NO_INIT',
  name: 'NO_INIT',
  createdAt: '1970-01-01T00:00:00.000Z',
  updatedAt: '1970-01-01T00:00:00.000Z',
  createdBy: 'NO_INIT',
  updatedBy: 'NO_INIT',
  versions: [],
});
