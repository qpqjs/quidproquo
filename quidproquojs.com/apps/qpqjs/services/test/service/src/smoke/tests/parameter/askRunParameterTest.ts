import {
  askConfigGetParameter,
  askConfigGetParameters,
  AskResponse,
} from 'quidproquo';

import {
  SMOKE_PROBE_PARAMETER,
  SMOKE_PROBE_PARAMETER_VALUE,
} from '../../constants/smokeProbe';
import { askSmokeAssert } from '../askSmokeAssert';

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
