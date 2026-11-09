import { ReportDimensions } from '../models/ReportDimensions';

/**
 * The cell key for a dimension tuple: every key and value as `k=v`, in key order, joined by `|`, with both sides
 * URI-encoded so a `=` or `|` inside a value cannot split it. Values are compared as text. No dimensions is ''.
 */
export const reportCellKey = (dimensions: ReportDimensions): string =>
  Object.keys(dimensions)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(dimensions[key]))}`)
    .join('|');
