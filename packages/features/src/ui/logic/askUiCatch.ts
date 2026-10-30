import { askCatch, AskResponse, EitherActionResult, Nullable, QPQError } from '@qpqjs/core';

export type UiCatchOptions = {
  // Clears the last failure before the work starts and records the new one if it fails.
  askSetError: (error: Nullable<string>) => AskResponse<void>;

  // Raised before the work and lowered in the catch's finally, so a throw mid-way
  // never leaves a spinner behind.
  askSetBusy?: (busy: boolean) => AskResponse<void>;

  // What the view shows on failure. A string replaces the server's text wholesale; a
  // function sees the error. Defaults to the error's own text.
  errorText?: string | ((error: QPQError) => string);
};

// The one shape for a UI story that runs a request and reports it through state: clear
// the error, flag busy, run the work under askCatch, record the failure. The result is
// handed back so the caller decides what success means (store it, reload, return it).
export function* askUiCatch<T>(work: AskResponse<T>, options: UiCatchOptions): AskResponse<EitherActionResult<T>> {
  if (options.askSetBusy) {
    yield* options.askSetBusy(true);
  }

  yield* options.askSetError(null);

  const result = yield* askCatch(work, options.askSetBusy ? options.askSetBusy(false) : undefined);

  if (!result.success) {
    const { errorText } = options;

    yield* options.askSetError(typeof errorText === 'function' ? errorText(result.error) : (errorText ?? result.error.errorText));
  }

  return result;
}
