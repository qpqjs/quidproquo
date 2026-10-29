import { WebEntryActionType } from '@qpqjs/webserver';

const webserverWebEntryActionComponentMap: Record<string, string[]> = {
  [WebEntryActionType.InvalidateCache]: ['askWebEntryInvalidateCache', 'webEntryName', 'paths'],
};

export default webserverWebEntryActionComponentMap;
