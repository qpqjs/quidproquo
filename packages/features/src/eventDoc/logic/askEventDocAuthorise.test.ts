import { Action, InlineFunctionActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { HTTPEvent } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { EventDocPermissionAction } from '../types/EventDocPermissionAction';
import { askEventDocAuthorise } from './askEventDocAuthorise';

const event = { path: '/docs', method: 'GET', headers: {}, query: {}, correlation: 'c', sourceIp: '1.1.1.1', isBase64Encoded: false } as HTTPEvent;

const run = (authorise: string | undefined, withEvent: boolean): unknown[] => {
  const calls: unknown[] = [];

  runStory(askEventDocAuthorise({ authorise, storeName: 'docs' }, EventDocPermissionAction.read, withEvent ? event : undefined), {
    [InlineFunctionActionType.Execute]: (action: Action<unknown>) => {
      calls.push(action.payload);
      return undefined;
    },
  });

  return calls;
};

describe('askEventDocAuthorise', () => {
  it("runs the collection's authoriser with the event, store name and action", () => {
    expect(run('docs-authorise', true)).toEqual([{ functionName: 'docs-authorise', payload: { event, storeName: 'docs', action: 'read' } }]);
  });

  it('leaves the event out for a caller that has none, so the authoriser sees no key rather than undefined', () => {
    expect(run('docs-authorise', false)).toEqual([{ functionName: 'docs-authorise', payload: { storeName: 'docs', action: 'read' } }]);
  });

  it('runs nothing for a collection without an authoriser', () => {
    expect(run(undefined, true)).toEqual([]);
    expect(run('', true)).toEqual([]);
  });
});
