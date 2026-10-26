import {
  askNetworkRequest,
  askOpenApiGetDocument,
  AskResponse,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SECURITY_PROBE_LEAK_MARKER } from '../constants/SECURITY_PROBE_LEAK_MARKER';

type ErrorBody = { errorType?: string; errorText?: string; error?: string };

// Checklist item: action dispatch loop (createRuntime, processAction,
// resolveStory). An unhandled exception in a processor or in story code must
// reach the caller as a bare 500, never with the exception's own message: that
// text names tables, paths, SDK failures and every registered action type.
export function* askRunRuntimeErrorTextLeakTest(): AskResponse<void> {
  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');

  const thrown = yield* askNetworkRequest<undefined, ErrorBody>(
    'GET',
    `${baseUrl}/v1/security/throw-raw`
  );
  yield* askSmokeAssert(
    thrown.status === 500,
    `throw-raw returned [${thrown.status}], expected 500`
  );
  yield* askSmokeAssert(
    !JSON.stringify(thrown.data).includes(SECURITY_PROBE_LEAK_MARKER),
    `throw-raw body carries the raw exception message: [${JSON.stringify(thrown.data)}]`
  );

  const unknown = yield* askNetworkRequest<undefined, ErrorBody>(
    'GET',
    `${baseUrl}/v1/security/unknown-action`
  );
  yield* askSmokeAssert(
    unknown.status === 500,
    `unknown-action returned [${unknown.status}], expected 500`
  );
  // The missing action's own name is fine; the list of every registered action is not.
  const unknownBody = JSON.stringify(unknown.data);
  yield* askSmokeAssert(
    !unknownBody.includes('@quidproquo-core/') &&
      !unknownBody.includes(' from ['),
    `unknown-action body lists the registered actions: [${unknownBody.slice(0, 300)}]`
  );
}
