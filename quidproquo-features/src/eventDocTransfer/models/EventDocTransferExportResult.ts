import { EventDocManifestItem } from './EventDocManifestItem';

/** Response of POST /transfer/export: a short-lived download link plus the manifest the bundle covers. */
export type EventDocTransferExportResult = {
  downloadUrl: string;
  filename: string;
  items: EventDocManifestItem[];
};
