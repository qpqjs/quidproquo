import { askConfigGetSecret, AskResponse } from 'quidproquo';

import { SMOKE_PROBE_SECRET } from '../../constants/smokeProbe';
import { askSmokeAssert } from '../askSmokeAssert';

// secretsmanager:GetSecretValue against an owned secret, granted by tag. The
// deployed secret is created without an explicit value, so the platform
// generates one; any non-empty string proves the read.
export function* askRunSecretTest(): AskResponse<void> {
  const value = yield* askConfigGetSecret(SMOKE_PROBE_SECRET);

  yield* askSmokeAssert(
    typeof value === 'string' && value.length > 0,
    'GetSecretValue returned an empty value'
  );
}
