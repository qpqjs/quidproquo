import {
  actionResult,
  askEventAutoRespondBase,
  createActionProcessor,
  DeployEventStatusType,
  DeployEventType,
  EventActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { InternalEventOutput, InternalEventRecord, MatchResult } from './types';

const getProcessAutoRespond = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventAutoRespondBase> => {
  return async ({ qpqEventRecord: rawQpqEventRecord, matchResult: rawMatchResult }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;
    const matchResult = rawMatchResult as MatchResult;

    // exit if we don't know what deploy type this is, probably another stack
    const earlyExit =
      qpqEventRecord.deployEventType === DeployEventType.Unknown || qpqEventRecord.deployEventStatusType === DeployEventStatusType.Unknown;

    // This is strange, but null means don't early exit.
    return actionResult(!earlyExit ? null : void 0);
  };
};

export const getEventAutoRespondActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
