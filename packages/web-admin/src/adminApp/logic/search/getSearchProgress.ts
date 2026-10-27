export const getSearchProgress = (results?: { partsTotal: number; partsDone: number }): number =>
  results && results.partsTotal > 0 ? (results.partsDone / results.partsTotal) * 100 : 0;
