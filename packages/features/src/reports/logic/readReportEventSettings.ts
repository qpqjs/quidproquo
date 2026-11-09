import { ReportEventSettings } from '../models/ReportEventSettings';
import { ReportsConfig } from '../models/ReportsConfig';

/** An event type's settings, when the report declares them; never a value inherited from Object.prototype ('constructor'). */
export const readReportEventSettings = (config: ReportsConfig, type: string): ReportEventSettings | undefined =>
  Object.prototype.hasOwnProperty.call(config.events, type) ? config.events[type] : undefined;
