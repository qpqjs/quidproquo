import { EventDocDocument, EventDocStatus } from '../models';

/**
 * Base-field defaults a module spreads into its initial state. INIT_STATE overlays the real identity and timestamps,
 * so these only surface for an empty log.
 */
export const createEventDocInitialDocumentState = (schemaVersion: number): EventDocDocument => ({
  schemaVersion,
  id: '',
  code: '',
  name: '',
  documentVersion: 1,
  status: EventDocStatus.Draft,
  createdAt: '1970-01-01T00:00:00.000Z',
  updatedAt: '1970-01-01T00:00:00.000Z',
});
