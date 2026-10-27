import { AiStreamPart } from 'quidproquo-core';

import { AiSdkStreamPart, AiSdkStreamPartOfType } from '../types';
import { mapAiStreamAbort } from './mapAiStreamAbort';
import { mapAiStreamCustom } from './mapAiStreamCustom';
import { mapAiStreamError } from './mapAiStreamError';
import { mapAiStreamFilePart } from './mapAiStreamFilePart';
import { mapAiStreamFinish } from './mapAiStreamFinish';
import { mapAiStreamFinishStep } from './mapAiStreamFinishStep';
import { mapAiStreamRaw } from './mapAiStreamRaw';
import { mapAiStreamReasoningDelta } from './mapAiStreamReasoningDelta';
import { mapAiStreamReasoningEnd } from './mapAiStreamReasoningEnd';
import { mapAiStreamReasoningFilePart } from './mapAiStreamReasoningFilePart';
import { mapAiStreamReasoningStart } from './mapAiStreamReasoningStart';
import { mapAiStreamSourcePart } from './mapAiStreamSourcePart';
import { mapAiStreamStart } from './mapAiStreamStart';
import { mapAiStreamStartStep } from './mapAiStreamStartStep';
import { mapAiStreamTextDelta } from './mapAiStreamTextDelta';
import { mapAiStreamTextEnd } from './mapAiStreamTextEnd';
import { mapAiStreamTextStart } from './mapAiStreamTextStart';
import { mapAiStreamToolApprovalRequest } from './mapAiStreamToolApprovalRequest';
import { mapAiStreamToolApprovalResponse } from './mapAiStreamToolApprovalResponse';
import { mapAiStreamToolCall } from './mapAiStreamToolCall';
import { mapAiStreamToolError } from './mapAiStreamToolError';
import { mapAiStreamToolInputDelta } from './mapAiStreamToolInputDelta';
import { mapAiStreamToolInputEnd } from './mapAiStreamToolInputEnd';
import { mapAiStreamToolInputStart } from './mapAiStreamToolInputStart';
import { mapAiStreamToolOutputDenied } from './mapAiStreamToolOutputDenied';
import { mapAiStreamToolResult } from './mapAiStreamToolResult';

export type AiStreamPartMappers = {
  [K in AiSdkStreamPart['type']]: (part: AiSdkStreamPartOfType<K>) => AiStreamPart;
};

export const aiStreamPartMappers: AiStreamPartMappers = {
  start: mapAiStreamStart,
  finish: mapAiStreamFinish,
  'start-step': mapAiStreamStartStep,
  'finish-step': mapAiStreamFinishStep,
  abort: mapAiStreamAbort,
  error: mapAiStreamError,
  raw: mapAiStreamRaw,
  source: mapAiStreamSourcePart,
  file: mapAiStreamFilePart,
  'reasoning-file': mapAiStreamReasoningFilePart,
  custom: mapAiStreamCustom,
  'text-start': mapAiStreamTextStart,
  'text-end': mapAiStreamTextEnd,
  'text-delta': mapAiStreamTextDelta,
  'reasoning-start': mapAiStreamReasoningStart,
  'reasoning-end': mapAiStreamReasoningEnd,
  'reasoning-delta': mapAiStreamReasoningDelta,
  'tool-input-start': mapAiStreamToolInputStart,
  'tool-input-end': mapAiStreamToolInputEnd,
  'tool-input-delta': mapAiStreamToolInputDelta,
  'tool-call': mapAiStreamToolCall,
  'tool-result': mapAiStreamToolResult,
  'tool-error': mapAiStreamToolError,
  'tool-output-denied': mapAiStreamToolOutputDenied,
  'tool-approval-request': mapAiStreamToolApprovalRequest,
  'tool-approval-response': mapAiStreamToolApprovalResponse,
};
