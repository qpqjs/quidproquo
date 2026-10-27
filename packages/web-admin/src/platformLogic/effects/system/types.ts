import { Effect } from 'quidproquo-core';

export enum SystemEffect {
  StartLoading = 'system/startLoading',
  StopLoading = 'system/stopLoading',
  ShowError = 'system/ShowError',
}

export type StartLoadingEffect = Effect<SystemEffect.StartLoading>;
export type StopLoadingEffect = Effect<SystemEffect.StopLoading>;
export type ShowErrorEffect = Effect<
  SystemEffect.ShowError,
  {
    msg: string;
    at: string;
    id: string;
  }
>;

export type AnySystemEffect = StartLoadingEffect | StopLoadingEffect | ShowErrorEffect;
