import { AskResponse, Nullable, QPQError } from '@qpqjs/core';

/** Options for askUiCatch. */
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
