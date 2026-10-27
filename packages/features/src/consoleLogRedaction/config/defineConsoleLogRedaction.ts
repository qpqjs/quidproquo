import { defineActionProcessors, QPQConfig } from '@qpqjs/core';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';

/**
 * Makes askLog redact its console output before printing, using the same redaction the admin
 * log viewer applies on read. Add it to any service whose console reaches a shared log store
 * such as CloudWatch. The story log itself is unchanged: it stores the raw action and is
 * redacted on read.
 */
export const defineConsoleLogRedaction = (): QPQConfig => [
  defineActionProcessors(
    getFeatureEntryQpqFunctionRuntime(
      'consoleLogRedaction',
      'actionProcessor',
      'getConsoleLogRedactionActionProcessors::getConsoleLogRedactionActionProcessors',
    ),
  ),
];
