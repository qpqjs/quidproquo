import { AskResponse, HTTPNetworkResponse } from 'quidproquo';

import { EchoRequest, EchoResponse } from '@qpqjs/test-models';

import { SmokeAwsProbeResult } from '../models/SmokeAwsProbeResult';
import { SmokeSurvivorProbeResult } from '../models/SmokeSurvivorProbeResult';

/** The exports of apps/qpqjs/userScripts/smoke, typed so the caller proxy checks member names and args. */
export type SmokeUserScriptFunctions = {
  add: (a: number, b: number) => number;
  greet: (name: string) => string;
  stampedGreeting: (name: string) => AskResponse<string>;
  postJson: (
    url: string,
    body: EchoRequest
  ) => AskResponse<HTTPNetworkResponse<EchoResponse>>;
  writeFile: (
    drive: string,
    filepath: string,
    text: string
  ) => AskResponse<void>;
  probeAwsAccess: (bucket: string, key: string) => Promise<SmokeAwsProbeResult>;
  startSurvivor: (port: number) => number;
  checkSurvivor: (port: number) => Promise<SmokeSurvivorProbeResult>;
};
