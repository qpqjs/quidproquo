// --- UI Action Generators ---

import { askDateNow, askNewGuid, AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { ShowErrorEffect, StartLoadingEffect, StopLoadingEffect, SystemEffect } from './types';

// System Actions
export function* askUIStartLoading(): AskResponse<void> {
  yield* askStateDispatchEffect<StartLoadingEffect>(SystemEffect.StartLoading);
}

export function* askUIStopLoading(): AskResponse<void> {
  yield* askStateDispatchEffect<StopLoadingEffect>(SystemEffect.StopLoading);
}

export function* askUIShowError(error: string): AskResponse<void> {
  yield* askStateDispatchEffect<ShowErrorEffect>(SystemEffect.ShowError, {
    msg: error,
    at: yield* askDateNow(),
    id: yield* askNewGuid(),
  });
}
