/** The dimension tuple a reportCellKey names, every value as text. Not for REPORT_OTHER_CELL_KEY, which names no tuple. */
export const parseReportCellKey = (cellKey: string): Record<string, string> =>
  Object.fromEntries(
    cellKey
      .split('|')
      .filter((pair) => pair !== '')
      .map((pair) => {
        const [key = '', value = ''] = pair.split('=');

        return [decodeURIComponent(key), decodeURIComponent(value)];
      }),
  );
