import { AskResponse } from 'quidproquo';

/** The exports of apps/qpqjs/userScripts/smoke, typed so the caller proxy checks member names and args. */
export type SmokeUserScriptFunctions = {
  add: (
    drive: string,
    filepath: string,
    a: number,
    b: number
  ) => AskResponse<number>;
  greet: (name: string) => string;
};
