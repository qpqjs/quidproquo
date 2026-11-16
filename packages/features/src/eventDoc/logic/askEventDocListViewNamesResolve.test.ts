import { askDynamicFunctionExecute, DynamicFunctionsActionType } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocStoreProvide, buildEventDocStore } from '../context';
import { askEventDocListViewNamesResolve } from './askEventDocListViewNamesResolve';

// Every writer of list view rows asks the definition which list views the collection has. A collection with nothing
// registered (or a registration from before list views) has only its summary, so it still answers, with that alone.

type ExecutePayload = { dynamicFunctionsName: string; functionName: string };

const resolve = (onExecute: (payload: ExecutePayload) => unknown, functionsName?: string) =>
  runStory(
    askEventDocStoreProvide(buildEventDocStore({ storeName: 'envelopes', type: 'envelope' }), askEventDocListViewNamesResolve(functionsName)),
    {
      [DynamicFunctionsActionType.Execute]: (action: { payload: ExecutePayload }) => onExecute(action.payload),
    },
  );

describe('askEventDocListViewNamesResolve', () => {
  it("reads the names off the collection's registered definition", () => {
    const asked: ExecutePayload[] = [];

    const names = resolve((payload) => {
      asked.push(payload);
      return ['summary', 'overview'];
    });

    expect(names).toEqual(['summary', 'overview']);
    expect(asked.map((payload) => [payload.dynamicFunctionsName, payload.functionName])).toEqual([
      [eventDocFunctionsName('envelopes', 'envelope'), 'getListViewNames'],
    ]);
  });

  it('asks the registry name it is handed, as the projector is by config', () => {
    let asked: string | undefined;

    resolve((payload) => {
      asked = payload.dynamicFunctionsName;
      return [];
    }, 'from-config');

    expect(asked).toBe('from-config');
  });

  it('resolves to the summary alone for a collection with no registered definition, or one without the member', () => {
    expect(resolve(() => throwsError(askDynamicFunctionExecute.errorType.DynamicFunctionsNotFound, 'nothing registered'))).toEqual(['summary']);
    expect(resolve(() => throwsError(askDynamicFunctionExecute.errorType.FunctionNotFound, 'no such member'))).toEqual(['summary']);
  });

  it('stays loud when a registered definition cannot be loaded', () => {
    expect(() => resolve(() => throwsError(askDynamicFunctionExecute.errorType.ModuleLoadFailed, 'module would not load'))).toThrow(
      /module would not load/,
    );
  });
});
