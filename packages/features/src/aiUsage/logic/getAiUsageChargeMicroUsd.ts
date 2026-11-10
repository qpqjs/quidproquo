import { getAiUsageAmountMicroUsd } from '@qpqjs/core';

import type { AiUsageReportInput } from '../types/AiUsageReportInput';

/**
 * What a call is charged at, in millionths of a US dollar: its model's `chargeRates`, or
 * `defaultChargeRates` for a model missing from them, so a forgotten model is never free.
 */
export const getAiUsageChargeMicroUsd = ({
  usage,
  model,
  chargeRates,
  defaultChargeRates,
  cacheTtl,
}: Pick<AiUsageReportInput, 'usage' | 'model' | 'chargeRates' | 'defaultChargeRates' | 'cacheTtl'>): number =>
  getAiUsageAmountMicroUsd(usage, chargeRates[model] ?? defaultChargeRates, cacheTtl);
