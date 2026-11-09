/** A report's EventDoc collection name; its events, snapshots and drive names derive from it. */
export const reportStoreName = (reportName: string): string => `${reportName}Reports`;
