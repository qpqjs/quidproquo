import {
  ActionHistory,
  ActionProcessorResult,
  HTTPNetworkResponse,
  isErroredActionResult,
  NetworkActionType,
  NetworkRequestActionPayload,
  Nullable,
  resolveActionResult,
} from 'quidproquo-core';

import { ActionSearchDefinition } from '../../domain/ActionSearchDefinition';
import { ActionSearchExtractedAction } from '../../domain/ActionSearchExtractedAction';
import { ActionSearchFieldType } from '../../domain/ActionSearchFieldType';
import { ActionSearchFilterOperator } from '../../domain/ActionSearchFilterOperator';

const getEntryDurationMs = (entry: ActionHistory): number => new Date(entry.finishedAt).getTime() - new Date(entry.startedAt).getTime();

const extractNetworkRequest = (entry: ActionHistory): Nullable<ActionSearchExtractedAction> => {
  const payload = entry.act.payload as NetworkRequestActionPayload<unknown> | undefined;
  if (!payload) {
    return null;
  }

  const res = entry.res as ActionProcessorResult<HTTPNetworkResponse<unknown>>;
  const status = !isErroredActionResult(res) ? resolveActionResult(res)?.status : undefined;

  return {
    fields: {
      url: `${payload.basePath ?? ''}${payload.url}`,
      method: payload.method,
      ...(typeof status === 'number' ? { status } : {}),
      durationMs: getEntryDurationMs(entry),
    },
  };
};

export const networkRequestActionSearchDefinition: ActionSearchDefinition = {
  action: {
    actionType: NetworkActionType.Request,
    viewName: 'Network Requests',
    fields: [
      { name: 'url', label: 'Url', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
      {
        name: 'method',
        label: 'Method',
        type: ActionSearchFieldType.Enum,
        operator: ActionSearchFilterOperator.Equals,
        enumValues: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      },
      { name: 'status', label: 'Status', type: ActionSearchFieldType.Number, operator: ActionSearchFilterOperator.Range },
      { name: 'durationMs', label: 'Duration (ms)', type: ActionSearchFieldType.Number, operator: ActionSearchFilterOperator.Range },
    ],
    extract: extractNetworkRequest,
  },
};
