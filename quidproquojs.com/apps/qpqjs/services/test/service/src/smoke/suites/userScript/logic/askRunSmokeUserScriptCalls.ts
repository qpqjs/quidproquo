import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';
import {
  askCatch,
  askFileExists,
  askOpenApiGetDocument,
  AskResponse,
  createUserScriptCaller,
  FileActionType,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SmokeUserScriptFunctions } from './SmokeUserScriptFunctions';

// What both build paths prove once their script is built: plain exports return their
// values, a story export runs with the sandbox's pure actions, a story can call out over
// HTTP (the service's own echo route, so the answer is provably this call's), and a story
// that reaches for a resource fails inside the sandbox with nothing written.
export function* askRunSmokeUserScriptCalls(
  builtPath: string,
  outputPath: string,
  label: string
): AskResponse<void> {
  const script = createUserScriptCaller<SmokeUserScriptFunctions>(
    SMOKE_PROBE_DRIVE,
    builtPath
  );

  const sum = yield* script.add(20, 22);
  yield* askSmokeAssert(sum === 42, 'plain export did not return its sum');

  const greeting = yield* script.greet(label);
  yield* askSmokeAssert(
    greeting === `hello ${label}`,
    'plain export did not return its value'
  );

  const stamped = yield* script.stampedGreeting(label);
  yield* askSmokeAssert(
    stamped.startsWith(`hello ${label} @ 20`),
    `story export did not run with the sandbox's pure actions: [${stamped}]`
  );

  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');
  const echoed = yield* script.postJson(`${baseUrl}/v1/echo/${label}`, {
    bodyValue: label,
  });
  yield* askSmokeAssert(
    echoed.status === 200 && echoed.data.bodyValue === label,
    `network request from inside the sandbox did not round-trip: [${echoed.status}] ${JSON.stringify(echoed.data)}`
  );

  const refused = yield* askCatch(
    script.writeFile(SMOKE_PROBE_DRIVE, outputPath, 'escaped')
  );
  yield* askSmokeAssert(
    !refused.success &&
      refused.error.errorText.includes(
        `Unable to process action: ${FileActionType.WriteTextContents}`
      ),
    `file write from inside the sandbox was not refused: ${
      refused.success ? 'it succeeded' : refused.error.errorText
    }`
  );

  const outputExists = yield* askFileExists(SMOKE_PROBE_DRIVE, outputPath);
  yield* askSmokeAssert(
    !outputExists,
    'a script wrote a file from inside the sandbox'
  );
}
