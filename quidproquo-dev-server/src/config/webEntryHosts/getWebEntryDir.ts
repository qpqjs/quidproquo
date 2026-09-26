import path from 'path';

/** Where a web entry's files live under the web root, whether it is hosted on a port or routed. */
export const getWebEntryDir = (webRoot: string, entry: { service: string; entryName: string }): string =>
  path.join(webRoot, 'entries', entry.service, entry.entryName);
