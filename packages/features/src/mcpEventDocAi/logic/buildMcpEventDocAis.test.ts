import { defineAi, QPQConfig } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { defineEventDocRoutes } from '../../eventDoc/routes/defineEventDocRoutes';
import { defineEventDocAi } from '../../eventDocAi/config/defineEventDocAi';
import { buildEventDocAiSetChatNameTool } from '../../eventDocAi/config/logic/buildEventDocAiSetChatNameTool';
import { buildMcpEventDocAis } from './buildMcpEventDocAis';

const tool = { name: 'describeFlow', description: 'Describe a flow', executor: 'describeFlowFn', inputSchema: {} };

const appConfig: QPQConfig = [
  defineEventDocRoutes({ storeName: 'plans', type: 'plan', basePath: '/plans', authorise: 'authoriseFn', scopeResolver: 'scopeFn' }),
  defineEventDocAi({ storeName: 'plans', type: 'plan', serviceName: 'planner', eventBusName: 'bus', userDirectoryName: 'users', tools: [tool] }),
];

describe('buildMcpEventDocAis', () => {
  it('joins each eventDoc AI with its collection store and its tools', () => {
    const eventDocAis = buildMcpEventDocAis(appConfig);

    expect(eventDocAis).toHaveLength(1);
    // A chat's own tools, then the one every chat is given to name itself.
    expect(eventDocAis[0]).toMatchObject({
      aiName: 'plans-ai',
      serviceName: 'planner',
      type: 'plan',
      tools: [tool, buildEventDocAiSetChatNameTool('plans')],
      isCollection: true,
    });
    expect(eventDocAis![0]!.store).toMatchObject({ storeName: 'plans', type: 'plan', authorise: 'authoriseFn', scopeResolver: 'scopeFn' });
  });

  it('falls back to a hookless store when the collection has no routes registered', () => {
    const eventDocAis = buildMcpEventDocAis([
      defineEventDocAi({ storeName: 'notes', type: 'note', serviceName: 'notes', eventBusName: 'bus', userDirectoryName: 'users' }),
      defineAi('unrelated'),
    ]);

    expect(eventDocAis![0]!.store).toMatchObject({ storeName: 'notes', type: 'note', authorise: undefined });
    expect(eventDocAis![0]!.isCollection).toBe(false);
  });
});
