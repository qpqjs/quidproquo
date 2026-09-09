import { EventDocManifestItem } from './EventDocManifestItem';

/** The manifest grouped by doc type for the export dialog. */
export type EventDocManifestGroup = {
  type: string;
  items: EventDocManifestItem[];
};
