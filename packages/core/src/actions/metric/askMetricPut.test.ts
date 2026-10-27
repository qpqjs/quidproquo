import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askMetricPut } from './askMetricPut';
import { MetricActionType } from './MetricActionType';
import { MetricUnit } from './MetricUnit';

describe('askMetricPut', () => {
  it('yields a Put action with the name, value, unit and dimensions', () => {
    const { action } = captureRequester(askMetricPut('templateGenerated', 3, { unit: MetricUnit.count, dimensions: { templateKind: 'docx' } }));

    expect(action).toEqual({
      type: MetricActionType.Put,
      payload: {
        metricName: 'templateGenerated',
        value: 3,
        unit: MetricUnit.count,
        dimensions: { templateKind: 'docx' },
      },
    });
  });

  it('defaults the value to 1 and leaves unit/dimensions undefined', () => {
    const { action } = captureRequester(askMetricPut('signIn'));

    expect(action).toEqual({
      type: MetricActionType.Put,
      payload: {
        metricName: 'signIn',
        value: 1,
        unit: undefined,
        dimensions: undefined,
      },
    });
  });

  it('resumes with no value once the runtime records the metric', () => {
    const { returned } = captureRequester(askMetricPut('signIn'), undefined);

    expect(returned).toBeUndefined();
  });
});
