import { SMOKE_CROSS_SERVICE_REPORT_APPEND_FUNCTION_NAME, SMOKE_CROSS_SERVICE_REPORT_READ_FUNCTION_NAME } from '@qpqjs/constants';
import { defineSmokeReport } from '@qpqjs/service-utils';
import { defineServiceFunction, QPQConfig } from 'quidproquo';

/**
 * The test service's smoke report, declared here exactly as it is there (test owns it, so this deploy gets references to
 * its bus and stores and its own copy of the month fold), plus the two service functions the cross-service test calls.
 */
export const defineReportsSmokeProbe = (): QPQConfig => [
  defineSmokeReport(),
  defineServiceFunction(
    { basePath: __dirname, relativePath: '../entry/serviceFunction/smokeCrossServiceReportAppend', functionName: 'smokeCrossServiceReportAppend' },
    { functionName: SMOKE_CROSS_SERVICE_REPORT_APPEND_FUNCTION_NAME },
  ),
  defineServiceFunction(
    { basePath: __dirname, relativePath: '../entry/serviceFunction/smokeCrossServiceReportRead', functionName: 'smokeCrossServiceReportRead' },
    { functionName: SMOKE_CROSS_SERVICE_REPORT_READ_FUNCTION_NAME },
  ),
];
