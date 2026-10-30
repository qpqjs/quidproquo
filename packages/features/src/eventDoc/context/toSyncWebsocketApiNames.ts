/** One list whichever way the sync option was written; '' and [] both mean no pushes. */
export const toSyncWebsocketApiNames = (syncWebsocketApiName: unknown): string[] => {
  if (Array.isArray(syncWebsocketApiName)) {
    return syncWebsocketApiName.filter((name): name is string => typeof name === 'string' && name !== '');
  }

  return typeof syncWebsocketApiName === 'string' && syncWebsocketApiName !== '' ? [syncWebsocketApiName] : [];
};
