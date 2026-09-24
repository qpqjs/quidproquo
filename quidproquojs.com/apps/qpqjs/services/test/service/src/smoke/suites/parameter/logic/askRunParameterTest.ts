import {
  askConfigGetParameter,
  askConfigGetParameters,
  AskResponse,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SMOKE_PROBE_PARAMETER } from '../constants/SMOKE_PROBE_PARAMETER';
import { SMOKE_PROBE_PARAMETER_VALUE } from '../constants/SMOKE_PROBE_PARAMETER_VALUE';

// ssm:GetParameter and ssm:GetParameters against an owned parameter, granted
// by tag. Read-only on purpose: the runtime role is not granted PutParameter.
export function* askRunParameterTest(): AskResponse<void> {
  const value = yield* askConfigGetParameter(SMOKE_PROBE_PARAMETER);
  yield* askSmokeAssert(
    value === SMOKE_PROBE_PARAMETER_VALUE,
    `GetParameter returned [${value}]`
  );

  const values = yield* askConfigGetParameters([SMOKE_PROBE_PARAMETER]);
  yield* askSmokeAssert(
    values.length === 1 && values[0] === SMOKE_PROBE_PARAMETER_VALUE,
    'GetParameters did not return the parameter'
  );
}
