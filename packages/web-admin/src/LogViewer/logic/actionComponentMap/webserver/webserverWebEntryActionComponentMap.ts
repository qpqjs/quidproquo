import { askWebEntryInvalidateCache, WebEntryActionType } from 'quidproquo-webserver';

const webserverWebEntryActionComponentMap: Record<string, string[]> = {
  [WebEntryActionType.InvalidateCache]: ['askWebEntryInvalidateCache', 'webEntryName', 'paths'],
};

export default webserverWebEntryActionComponentMap;
