import { describe, expect, it } from 'vitest';

import { REPORT_OTHER_CELL_KEY } from '../constants/reportOtherCellKey';
import { parseReportCellKey } from './parseReportCellKey';
import { reportCellKey } from './reportCellKey';

describe('reportCellKey', () => {
  it('is the same key whatever order the dimensions were written in', () => {
    expect(reportCellKey({ templateKind: 'docx', outcome: 'ok' })).toBe('outcome=ok|templateKind=docx');
    expect(reportCellKey({ outcome: 'ok', templateKind: 'docx' })).toBe('outcome=ok|templateKind=docx');
  });

  it('round-trips through parseReportCellKey, values as text, even when a value holds = or |', () => {
    const dimensions = { kind: 'a=b|c', pages: 4, signed: true, 'odd key': 'x' };

    expect(parseReportCellKey(reportCellKey(dimensions))).toEqual({ kind: 'a=b|c', pages: '4', signed: 'true', 'odd key': 'x' });
  });

  it('keys no dimensions as the empty string, which can never be the other cell', () => {
    expect(reportCellKey({})).toBe('');
    expect(parseReportCellKey('')).toEqual({});
    expect(reportCellKey({})).not.toBe(REPORT_OTHER_CELL_KEY);
  });
});
