/**
 * The time range a view reads, resolved against the clock at each read. Weeks start on Monday, "last N days" counts
 * today as the last of the N, and calendar periods include their days still to come. `Last` is a rolling window.
 */
export enum ReportPeriod {
  Today = 'today',
  Yesterday = 'yesterday',
  ThisWeek = 'thisWeek',
  LastWeek = 'lastWeek',
  ThisMonth = 'thisMonth',
  LastMonth = 'lastMonth',
  Last7Days = 'last7Days',
  Last30Days = 'last30Days',
  ThisQuarter = 'thisQuarter',
  ThisYear = 'thisYear',
  ThisFinancialYear = 'thisFinancialYear',
  LastFinancialYear = 'lastFinancialYear',
  Last = 'last',
}
