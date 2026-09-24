import { defineParameter, QPQConfig } from 'quidproquo';

import { SMOKE_PROBE_PARAMETER } from '../constants/SMOKE_PROBE_PARAMETER';
import { SMOKE_PROBE_PARAMETER_VALUE } from '../constants/SMOKE_PROBE_PARAMETER_VALUE';

/** An owned parameter with a known value, for the parameter test to read back. */
export const defineParameterSmoke = (): QPQConfig => [
  defineParameter(SMOKE_PROBE_PARAMETER, {
    value: SMOKE_PROBE_PARAMETER_VALUE,
  }),
];
