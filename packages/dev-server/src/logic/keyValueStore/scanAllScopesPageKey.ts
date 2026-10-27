// Where a cross-scope scan got to: which partition, and how far into it.
//
// The scope is stored by NAME rather than by position in the partition list. A folder can
// appear between pages (another tenant gets its first write mid-scan), and an index would
// then point at a different partition on resume, skipping or repeating one.
export type ScanAllScopesPageKey = {
  scope?: string;
  inner?: string;
};

export const encodeScanAllScopesPageKey = (pageKey: ScanAllScopesPageKey): string => Buffer.from(JSON.stringify(pageKey), 'utf8').toString('base64');

export const decodeScanAllScopesPageKey = (encoded?: string): ScanAllScopesPageKey => {
  if (!encoded) {
    return {};
  }

  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as ScanAllScopesPageKey;
  } catch {
    // An unreadable key means resuming from an unknown place. Starting over is the only safe
    // answer: silently treating it as "finished" would end a migration early and look like
    // success.
    throw new Error('Invalid scan-all-scopes page key');
  }
};
