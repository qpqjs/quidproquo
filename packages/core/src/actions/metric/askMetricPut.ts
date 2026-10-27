import { createActionRequester } from '../../types';
import { MetricActionType } from './MetricActionType';
import { MetricUnit } from './MetricUnit';

export type AskMetricPutOptions = {
  unit?: MetricUnit;

  /**
   * Extra metric dimensions on top of the standard service/environment ones. Each unique
   * dimension combination is its own metric (and its own cost) - keep these
   * low-cardinality: never per-user or per-request identifiers.
   */
  dimensions?: Record<string, string>;
};

export const askMetricPut = createActionRequester<void>()({
  actionType: MetricActionType.Put,
  getPayload: (metricName: string, value: number = 1, options?: AskMetricPutOptions) => ({
    metricName,
    value,
    unit: options?.unit,
    dimensions: options?.dimensions,
  }),
});
