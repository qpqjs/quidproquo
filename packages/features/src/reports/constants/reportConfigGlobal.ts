/** The config global every service reads a report's declaration from. */
export const reportConfigGlobal = (reportName: string): string => `${reportName}ReportsConfig`;
