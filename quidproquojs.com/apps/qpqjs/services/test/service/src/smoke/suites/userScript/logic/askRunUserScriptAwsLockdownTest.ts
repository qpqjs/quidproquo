import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';
import {
  askFileDelete,
  askFileExists,
  askFileGenerateTemporarySecureUrl,
  askFileWriteTextContents,
  askGuidNew,
  AskResponse,
  askUserScriptBuild,
  createUserScriptCaller,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SMOKE_USER_SCRIPT_SOURCES } from '../generated/SMOKE_USER_SCRIPT_SOURCES';
import { SmokeAwsProbeOutcome } from '../models/SmokeAwsProbeOutcome';
import { parseS3ObjectFromUrl } from './parseS3ObjectFromUrl';
import { SmokeUserScriptFunctions } from './SmokeUserScriptFunctions';

// Deployed only: proves the sandbox is an IAM boundary, not just a short processor list. The
// script calls the probe module, which goes at this service's own bucket (and the account)
// with the AWS SDK directly, using any credentials it can find or scrape. Everything must come
// back denied, the only identity it can reach must be the runner's own role, and no AWS_*
// variable may be visible to it.
export function* askRunUserScriptAwsLockdownTest(): AskResponse<void> {
  const scriptId = yield* askGuidNew();
  const directory = `smoke/userScript/lockdown-${scriptId}`;
  const sourceDirectory = `${directory}/source`;
  const builtPath = `${directory}/built.js`;

  for (const relativePath of Object.keys(SMOKE_USER_SCRIPT_SOURCES)) {
    yield* askFileWriteTextContents(SMOKE_PROBE_DRIVE, `${sourceDirectory}/${relativePath}`, SMOKE_USER_SCRIPT_SOURCES[relativePath]);
  }
  yield* askUserScriptBuild(SMOKE_PROBE_DRIVE, sourceDirectory, builtPath);

  // The real bucket and key of the built file, read off a presigned URL for it.
  const secureUrl = yield* askFileGenerateTemporarySecureUrl(SMOKE_PROBE_DRIVE, builtPath, 60_000);
  const { bucket, key } = parseS3ObjectFromUrl(secureUrl);

  const script = createUserScriptCaller<SmokeUserScriptFunctions>(SMOKE_PROBE_DRIVE, builtPath);
  const report = yield* script.probeAwsAccess(bucket, key);

  yield* askSmokeAssert(report.awsEnvNames.length === 0, `the sandbox can see AWS variables: [${report.awsEnvNames.join(', ')}]`);
  yield* askSmokeAssert(
    report.defaultChain.outcome === SmokeAwsProbeOutcome.noCredentials,
    `the SDK's own credential lookup did not end in no credentials (${report.defaultChain.outcome}): ${report.defaultChain.detail}`,
  );

  if (report.parentCredentialsFound) {
    yield* askSmokeAssert(
      (report.identity ?? '').includes('uscript-runner-role'),
      `scraped credentials belong to something other than the runner role: [${report.identity}]`,
    );
    yield* askSmokeAssert(report.attempts.length > 0, 'the probe recorded no calls with the scraped credentials');
  }
  for (const attempt of report.attempts) {
    yield* askSmokeAssert(
      attempt.outcome === SmokeAwsProbeOutcome.denied,
      `${attempt.name} from inside the sandbox was ${attempt.outcome}: ${attempt.detail}`,
    );
  }

  const escapedExists = yield* askFileExists(SMOKE_PROBE_DRIVE, `${builtPath}.escaped`);
  yield* askSmokeAssert(!escapedExists, 'the sandbox wrote to the bucket with the SDK');

  yield* askFileDelete(SMOKE_PROBE_DRIVE, [
    ...Object.keys(SMOKE_USER_SCRIPT_SOURCES).map((relativePath) => `${sourceDirectory}/${relativePath}`),
    builtPath,
  ]);
}
