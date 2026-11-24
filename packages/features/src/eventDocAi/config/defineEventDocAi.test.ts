import { QPQCoreConfigSettingType, qpqCoreUtils, QueueQPQConfigSetting } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AUTHORISER_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { defineEventDocAi } from './defineEventDocAi';

// create, list, history, send and row content.
const CHAT_HANDLER_COUNT = 5;

const baseOptions = { storeName: 'docs', type: 'doc', serviceName: 'svc', eventBusName: 'ws-events', userDirectoryName: 'users' };

const processorGlobals = (authorise?: string) => {
  const config = defineEventDocAi({ ...baseOptions, authorise });
  const queue = config.find(
    (setting) => (setting as QueueQPQConfigSetting).configSettingType === QPQCoreConfigSettingType.queue,
  ) as QueueQPQConfigSetting;

  return Object.values(queue.qpqQueueProcessors).map((runtime: any) => runtime.globals[EVENT_DOC_AUTHORISER_GLOBAL]);
};

describe('defineEventDocAi queue', () => {
  it('gives a chat step one try, so a failing step is not paid for again and again', () => {
    const queue = defineEventDocAi(baseOptions).find(
      (setting) => (setting as QueueQPQConfigSetting).configSettingType === QPQCoreConfigSettingType.queue,
    ) as QueueQPQConfigSetting;

    expect(queue.maxTries).toBe(1);
  });
});

// Security regression: the chat handlers learn the collection's authoriser through their globals; without it the
// websocket chat path would run ungated while the routes and tools are gated.
describe('defineEventDocAi authorise', () => {
  it("carries the collection's authoriser to every chat handler", () => {
    expect(processorGlobals('docs-authorise')).toEqual(Array(CHAT_HANDLER_COUNT).fill('docs-authorise'));
  });

  it('carries an empty authoriser when none is declared', () => {
    expect(processorGlobals()).toEqual(Array(CHAT_HANDLER_COUNT).fill(''));
  });
});

describe('defineEventDocAi stores', () => {
  const kvsByName = (scoped?: boolean) =>
    Object.fromEntries(
      qpqCoreUtils.getAllKeyValueStoreConfigs(defineEventDocAi({ ...baseOptions, scoped })).map((kvs) => [kvs.keyValueStoreName, kvs]),
    );
  const drivesByName = (scoped?: boolean) =>
    Object.fromEntries(
      qpqCoreUtils.getAllStorageDriveConfigs(defineEventDocAi({ ...baseOptions, scoped })).map((drive) => [drive.storageDrive, drive]),
    );

  it("keys the rows store by a chat's document and chat, then by row id, so a chat reads in order", () => {
    const rows = kvsByName().docsAiChatRows;

    expect(rows?.partitionKey.key).toBe('pk');
    expect(rows?.sortKeys.map((sortKey) => sortKey.key)).toEqual(['sk']);
  });

  it('declares a drive for the row content too big for a row', () => {
    expect(Object.keys(drivesByName())).toContain('docsaichatblobs');
  });

  // Security regression: a tenanted collection's chats must be partitioned per tenant everywhere they are kept.
  it('hands one scoped flag to every store and drive it declares', () => {
    expect(Object.values(kvsByName(true)).every((kvs) => kvs.scoped)).toBe(true);
    expect(Object.values(drivesByName(true)).every((drive) => drive.scoped)).toBe(true);
    expect(Object.values(kvsByName()).some((kvs) => kvs.scoped)).toBe(false);
  });

  // The chats, their rows and their big values are data nothing can rebuild, so the deployment decides what happens
  // to them. Only the two left over from when a chat was one file are marked for deletion.
  it('marks only the retired chat list and chat drive as deleted when they leave the config', () => {
    const deleteOnRemove = (settings: Record<string, { deleteOnRemove?: boolean }>) =>
      Object.fromEntries(Object.entries(settings).map(([name, setting]) => [name, setting.deleteOnRemove]));

    expect(deleteOnRemove(kvsByName())).toEqual({ docsAiChatList: undefined, docsAiChatRows: undefined, docsAiChats: true });
    expect(deleteOnRemove(drivesByName())).toEqual({ docsaichatblobs: undefined, docsaichats: true });
  });
});
