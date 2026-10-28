import { QPQCoreConfigSettingType, QueueQPQConfigSetting } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AUTHORISER_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { defineEventDocAi } from './defineEventDocAi';

const baseOptions = { storeName: 'docs', type: 'doc', serviceName: 'svc', eventBusName: 'ws-events', userDirectoryName: 'users' };

const processorGlobals = (authorise?: string) => {
  const config = defineEventDocAi({ ...baseOptions, authorise });
  const queue = config.find(
    (setting) => (setting as QueueQPQConfigSetting).configSettingType === QPQCoreConfigSettingType.queue,
  ) as QueueQPQConfigSetting;

  return Object.values(queue.qpqQueueProcessors).map((runtime: any) => runtime.globals[EVENT_DOC_AUTHORISER_GLOBAL]);
};

// Security regression: the chat handlers learn the collection's authoriser through their globals; without it the
// websocket chat path would run ungated while the routes and tools are gated.
describe('defineEventDocAi authorise', () => {
  it("carries the collection's authoriser to every chat handler", () => {
    expect(processorGlobals('docs-authorise')).toEqual(['docs-authorise', 'docs-authorise', 'docs-authorise', 'docs-authorise']);
  });

  it('carries an empty authoriser when none is declared', () => {
    expect(processorGlobals()).toEqual(['', '', '', '']);
  });
});
