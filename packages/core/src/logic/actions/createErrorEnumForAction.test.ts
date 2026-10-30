import { describe, expect, it } from 'vitest';

import { createErrorEnumForAction, createErrorTypeEnumValue } from './createErrorEnumForAction';

describe('createErrorTypeEnumValue', () => {
  it('joins the action type and error name with a dash', () => {
    expect(createErrorTypeEnumValue('KeyValueStore::Get', 'StoreNotFound')).toBe('KeyValueStore::Get-StoreNotFound');
  });
});

describe('createErrorEnumForAction', () => {
  it('maps every error name to its namespaced value', () => {
    const errorEnum = createErrorEnumForAction('Websocket::SendMessage', ['Throttled', 'Disconnected']);

    expect(errorEnum.Throttled).toBe('Websocket::SendMessage-Throttled');
    expect(errorEnum.Disconnected).toBe('Websocket::SendMessage-Disconnected');
    expect(Object.keys(errorEnum)).toEqual(['Throttled', 'Disconnected']);
  });

  it('returns an empty enum for an action with no errors', () => {
    const errorEnum = createErrorEnumForAction('Graph::GetEndpoints', []);

    expect(Object.keys(errorEnum)).toEqual([]);
  });

  it('keeps prototype-clashing names like __proto__ as own entries', () => {
    const errorEnum = createErrorEnumForAction('Some::Action', ['__proto__', 'constructor']);

    expect(Object.keys(errorEnum)).toEqual(['__proto__', 'constructor']);
    expect(errorEnum['__proto__']).toBe('Some::Action-__proto__');
    expect(errorEnum['constructor']).toBe('Some::Action-constructor');
  });
});
