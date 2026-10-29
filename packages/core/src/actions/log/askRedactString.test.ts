import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askRedactString } from './askRedactString';
import { LogActionType } from './LogActionType';

describe('askRedactString', () => {
  it('yields a RedactString action carrying the value', () => {
    const { action } = captureRequester(askRedactString('s3cr3t-value'));

    expect(action).toEqual({ type: LogActionType.RedactString, payload: { value: 's3cr3t-value' } });
  });

  it('returns nothing', () => {
    const { returned } = captureRequester(askRedactString('s3cr3t-value'));

    expect(returned).toBeUndefined();
  });
});
