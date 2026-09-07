import { Nullable } from 'quidproquo-core';

import { EventDocSummary } from '../../../eventDoc/models';
import { EventDocManifestItem, EventDocTransferExportResult } from '../../models';

/** The export dialog. `items` empty means picking; populated means previewing (a manifest always holds at least the picked docs). */
export type EventDocExportUiState = {
  isOpen: boolean;
  // The whole collection, loaded when the dialog opened.
  candidates: EventDocSummary[];
  selectedIds: string[];
  // The manifest of the picked docs; empty until the preview.
  items: EventDocManifestItem[];
  isLoading: boolean;
  isExporting: boolean;
  error: Nullable<string>;
  result: Nullable<EventDocTransferExportResult>;
};

/** Initial (closed) export dialog state. */
export const createInitialEventDocExportUiState = (): EventDocExportUiState => ({
  isOpen: false,
  candidates: [],
  selectedIds: [],
  items: [],
  isLoading: false,
  isExporting: false,
  error: null,
  result: null,
});
