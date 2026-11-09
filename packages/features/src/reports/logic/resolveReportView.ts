import { ReportsConfig } from '../models/ReportsConfig';
import { ReportViewDefinition } from '../models/ReportViewDefinition';
import { ReportViewResolution } from '../types/ReportViewResolution';
import { reportViewProblem } from './reportViewProblem';

/** A declared view by name (own properties only), or an ad hoc view given the same checks a declared one gets at definition. */
export const resolveReportView = (config: ReportsConfig, nameOrView: string | ReportViewDefinition): ReportViewResolution => {
  if (typeof nameOrView === 'string') {
    const view = Object.prototype.hasOwnProperty.call(config.views, nameOrView) ? config.views[nameOrView] : undefined;

    return view ? { view } : { problem: `the report declares no view named '${nameOrView}'` };
  }

  const problem = reportViewProblem(nameOrView);

  return problem === null ? { view: nameOrView } : { problem };
};
