import { AskResponse } from 'quidproquo';

/** The exports of apps/qpqjs/userScripts/smoke, typed so the caller proxy checks member names and args. */
export type SmokeUserScriptFunctions = {
  add: (a: number, b: number) => number;
  greet: (name: string) => string;
  stampedGreeting: (name: string) => AskResponse<string>;
  writeFile: (
    drive: string,
    filepath: string,
    text: string
  ) => AskResponse<void>;
};
