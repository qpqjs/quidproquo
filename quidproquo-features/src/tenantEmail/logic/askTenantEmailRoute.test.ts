import {
  Action,
  ConfigActionType,
  InlineFunctionActionType,
  KeyValueStoreActionType,
  LogActionType,
  runStory,
  storageScopeContext,
} from 'quidproquo-core';
import { EmailMessage } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { toTenantId } from '../../tenant/logic/toTenantId';
import { TenantEmailInbox } from '../models/TenantEmailInbox';
import { TenantedEmailReceivedEvent } from '../types/TenantedEmailReceivedEvent';
import { askTenantEmailRoute } from './askTenantEmailRoute';

const message = (recipients: string[]): EmailMessage => ({
  recipients,
  from: [{ address: 'ada@example.org' }],
  to: [],
  cc: [],
  replyTo: [],
  subject: 'hi',
  attachments: [],
  authentication: { spf: 'pass', dkim: 'pass' },
  messageId: '<m1>',
});

const inboxes: Record<string, TenantEmailInbox> = {
  'finance.commbank': { address: 'finance.commbank', tenantId: toTenantId('t-commbank'), label: '', createdAt: 'now', createdByUserId: 'u1' },
  'info.anz': { address: 'info.anz', tenantId: toTenantId('t-anz'), label: '', createdAt: 'now', createdByUserId: 'u2' },
};

type ExecuteAction = Action<{ functionName: string; payload: TenantedEmailReceivedEvent }> & { context?: Record<string, unknown> };

// The scope provider stamps its value onto every action it relays (action.context), which is
// what the runtime merges into the inline function's session: so the scope the app handler
// runs under is readable off the Execute action itself.
const run = (recipients: string[]) => {
  const executes: ExecuteAction[] = [];
  const logs: string[] = [];

  runStory(askTenantEmailRoute(message(recipients)), {
    [ConfigActionType.GetGlobal]: 'on-email-fn',
    [KeyValueStoreActionType.Get]: (action: Action<{ key: string }>) => inboxes[action.payload?.key ?? ''] ?? null,
    [LogActionType.TemplateLiteral]: (action: Action<{ messageParts: [string[], unknown[]] }>) => {
      const [strings, variables] = action.payload?.messageParts ?? [[], []];
      logs.push(strings.map((part, index) => `${part}${variables[index] ?? ''}`).join(''));
    },
    [InlineFunctionActionType.Execute]: (action: ExecuteAction) => {
      executes.push(action);
    },
  });

  return { executes, logs };
};

describe('askTenantEmailRoute', () => {
  it('runs the app handler once per registered recipient, inside that inbox tenant scope', () => {
    const { executes } = run(['Finance.CommBank@inbox.development.example.com', 'info.anz@inbox.development.example.com']);

    expect(executes.map((action) => action.payload?.functionName)).toEqual(['on-email-fn', 'on-email-fn']);
    expect(executes.map((action) => action.payload?.payload.inbox.tenantId)).toEqual(['t-commbank', 't-anz']);
    expect(executes.map((action) => action.context?.[storageScopeContext.uniqueName])).toEqual(['TENANT#t-commbank', 'TENANT#t-anz']);
    expect(executes[0].payload?.payload.recipient).toBe('Finance.CommBank@inbox.development.example.com');
    expect(executes[0].payload?.payload.message.subject).toBe('hi');
  });

  it('logs and skips an unregistered recipient without throwing', () => {
    const { executes, logs } = run(['nobody@inbox.development.example.com', 'info.anz@inbox.development.example.com']);

    expect(executes).toHaveLength(1);
    expect(logs.join('\n')).toMatch(/no inbox registered for \[nobody@inbox.development.example.com\]/);
  });
});
