import { askCatch, AskResponse, EitherActionResult } from '@qpqjs/core';

import { UiCatchOptions } from './UiCatchOptions';

// The one shape for a UI story that runs a request and reports it through state: clear
// the error, flag busy, run the work under askCatch, record the failure. The result is
// handed back so the caller decides what success means (store it, reload, return it).
export function* askUiCatch<T>(work: AskResponse<T>, options: UiCatchOptions): AskResponse<EitherActionResult<T>> {
  // The error is cleared first: a module's SetError commonly resets its busy flags as well, so clearing it after
  // raising busy would drop the flag the moment it was raised.
  yield* options.askSetError(null);

  if (options.askSetBusy) {
    yield* options.askSetBusy(true);
  }

  const result = yield* askCatch(work, options.askSetBusy ? options.askSetBusy(false) : undefined);

  if (!result.success) {
    const { errorText } = options;

    yield* options.askSetError(typeof errorText === 'function' ? errorText(result.error) : (errorText ?? result.error.errorText));
  }

  return result;
}
