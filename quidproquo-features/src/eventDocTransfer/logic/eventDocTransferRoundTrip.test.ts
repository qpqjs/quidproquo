import {
  askKeyValueStoreUpsertBase,
  ConfigActionType,
  DateActionType,
  DynamicFunctionsActionType,
  DynamicFunctionsExecuteErrorTypeEnum,
  FileActionType,
  GuidActionType,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  QPQBinaryData,
  runStory,
  throwsError,
  UserDirectoryActionType,
} from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName, eventDocFunctionsName, eventDocStorageDriveName } from '../../eventDoc/constants';
import { eventDocAssetPath } from '../../eventDoc/data';
import { EventDocEffect, EventDocEvent, EventDocLink, EventDocLinkMode, EventDocSummary } from '../../eventDoc/models';
import { foldEventDocSummary } from '../../eventDoc/summary';
import {
  EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL,
  EVENT_DOC_TRANSFER_DRIVE_NAME,
  EVENT_DOC_TRANSFER_SCOPE_RESOLVER_GLOBAL,
  EVENT_DOC_TRANSFER_SERVICE_GLOBAL,
  eventDocTransferDiscardedPath,
  eventDocTransferImportPath,
} from '../constants';
import { EventDocBundle, EventDocTransferStatus } from '../models';
import { exportBundle } from '../routes/controllers/exportBundle';
import { importBundle } from '../routes/controllers/importBundle';
import { manifest } from '../routes/controllers/manifest';
import { plan } from '../routes/controllers/plan';
import { upload } from '../routes/controllers/upload';

// Proves the transfer end to end through the REAL controllers, across two independent
// "environments" that share nothing but the bundle: export from one, import into the other, and
// assert the folded state matches. The reference collector is mocked exactly as an app would
// register it (a dynamic-functions object whose collectReferences reads links off the doc's own
// events).

const SERVICE = 'template';

const TEMPLATES_STORE = 'templates';
const CONTENT_STORE = 'contents';
const STYLES_STORE = 'styles';

const TEMPLATE_TYPE = 'template';
const CONTENT_TYPE = 'content';
const STYLE_TYPE = 'style';

// The event types the mocked collector treats as reference-bearing, mirroring how doccypoccy's
// templates carry layout/style/content links in their own domain events.
const LINK_EVENT_TYPES = ['ADD_STYLE_LINK', 'SET_CONTENT_LINK'];

const COLLECTIONS = [
  { storeName: TEMPLATES_STORE, type: TEMPLATE_TYPE },
  { storeName: CONTENT_STORE, type: CONTENT_TYPE },
  { storeName: STYLES_STORE, type: STYLE_TYPE },
];

// Styles are a leaf: no registered functions object, so the walk stops at them (the execute
// resolves to DynamicFunctionsNotFound, which askEventDocReferences reads as "leaf").
const REGISTERED_FUNCTIONS = new Set([eventDocFunctionsName(TEMPLATES_STORE, TEMPLATE_TYPE), eventDocFunctionsName(CONTENT_STORE, CONTENT_TYPE)]);

const storeNameForType = (type: string): string =>
  ({ [TEMPLATE_TYPE]: TEMPLATES_STORE, [CONTENT_TYPE]: CONTENT_STORE, [STYLE_TYPE]: STYLES_STORE })[type] ?? TEMPLATES_STORE;

const link = (type: string, id: string): EventDocLink => ({
  eventDocService: SERVICE,
  eventDocType: type,
  id,
  mode: EventDocLinkMode.Latest,
});

const eventId = (n: number): number => n;

const event = (index: number, type: string, data: unknown): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: 1,
      clientMessageId: `msg-${index}`,
      createdBy: { userId: 'author-1', userDisplayName: 'Author One' },
      createdAt: `2026-07-20T00:00:0${index}.000Z`,
      eventId: eventId(index),
    },
  },
});

const initEvent = (id: string, code: string, name: string): EventDocEvent => event(0, EventDocEffect.InitState, { id, code, name });

// --- KVS mock query support (same shape as the eventDoc scoped round-trip test) ---

const isCondition = (op: KvsQueryOperation): op is KvsQueryCondition => 'key' in op;

const matches = (item: Record<string, unknown>, op: KvsQueryOperation): boolean => {
  if (isCondition(op)) {
    const actual = item[op.key];
    switch (op.operation) {
      case KvsQueryOperationType.Equal:
        return actual === op.valueA;
      case KvsQueryOperationType.GreaterThan:
        return typeof actual === 'number' && typeof op.valueA === 'number' && actual > op.valueA;
      default:
        throw new Error(`Test KVS mock does not support operator: ${op.operation}`);
    }
  }

  const logical = op as KvsLogicalOperator;

  if (logical.operation === KvsLogicalOperatorType.And) {
    return logical.conditions.every((condition) => matches(item, condition));
  }

  throw new Error(`Test KVS mock does not support logical operator: ${logical.operation}`);
};

type TestEnvironment = {
  tables: Record<string, Record<string, unknown>[]>;
  files: Record<string, unknown>;
  mocks: Record<string, unknown>;
  seedDoc: (type: string, events: EventDocEvent[], assets?: { guid: string; data: QPQBinaryData }[]) => void;
};

// One environment: its own KVS tables and its own blob storage. Nothing is shared between two of
// these, which is what makes the round trip an honest cross-environment test.
const buildEnvironment = (environmentName: string): TestEnvironment => {
  const tables: Record<string, Record<string, unknown>[]> = {};
  const files: Record<string, unknown> = {};

  let guidCounter = 0;
  let clock = Date.parse('2026-07-26T00:00:00.000Z');

  const globals: Record<string, unknown> = {
    [EVENT_DOC_TRANSFER_SERVICE_GLOBAL]: SERVICE,
    [EVENT_DOC_TRANSFER_COLLECTIONS_GLOBAL]: COLLECTIONS.map((collection) => ({
      storeName: collection.storeName,
      type: collection.type,
      onPublish: '',
      onAppend: '',
    })),
    [EVENT_DOC_TRANSFER_SCOPE_RESOLVER_GLOBAL]: '',
  };

  const tableFor = (storeName: string): Record<string, unknown>[] => (tables[storeName] ??= []);

  const seedDoc = (type: string, events: EventDocEvent[], assets: { guid: string; data: QPQBinaryData }[] = []): void => {
    const summary = { ...foldEventDocSummary(events), type };
    const storeName = storeNameForType(type);

    tableFor(storeName).push({ ...summary });
    events.forEach((seeded) =>
      tableFor(eventDocEventsStoreName(storeName)).push({ pk: summary.id, sk: seeded.payload.metadata.eventId, data: seeded }),
    );

    assets.forEach((asset) => {
      files[`${eventDocStorageDriveName(storeName)}/${eventDocAssetPath(summary.id, asset.guid)}`] = asset.data;
    });
  };

  const mocks = {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',

    [ConfigActionType.GetApplicationInfo]: { name: 'testapp', environment: environmentName, module: SERVICE },

    // Whoever is importing here. Deliberately different per environment: a source user id is
    // meaningless in the target directory, so the import re-attributes to this one.
    [UserDirectoryActionType.ReadAccessToken]: {
      userId: `${environmentName}-importer`,
      username: `${environmentName} importer`,
      exp: 0,
      userDirectory: 'test-user-directory',
      wasValid: true,
    },

    [DateActionType.Now]: () => new Date((clock += 1000)).toISOString(),
    [GuidActionType.New]: () => `${environmentName}-guid-${++guidCounter}`,

    // The app-registered functions objects: collectReferences reads the links straight off the
    // doc's events, which is what a real definition does after folding. Leaf collections have no
    // registration, surfacing as the processor's DynamicFunctionsNotFound.
    [DynamicFunctionsActionType.Execute]: (action: { payload: { dynamicFunctionsName: string; functionName: string; args: [EventDocEvent[]] } }) => {
      if (!REGISTERED_FUNCTIONS.has(action.payload.dynamicFunctionsName)) {
        return throwsError(
          DynamicFunctionsExecuteErrorTypeEnum.DynamicFunctionsNotFound,
          `Dynamic functions not found: [${action.payload.dynamicFunctionsName}]`,
        );
      }

      if (action.payload.functionName !== 'collectReferences') {
        throw new Error(`Unexpected dynamic function member: ${action.payload.functionName}`);
      }

      return action.payload.args[0].filter((candidate) => LINK_EVENT_TYPES.includes(candidate.type)).map((candidate) => candidate.payload.data);
    },

    [KeyValueStoreActionType.Upsert]: (action: {
      payload: { keyValueStoreName: string; item: Record<string, unknown>; options?: { ifNotExists?: boolean } };
    }) => {
      const { keyValueStoreName, item, options } = action.payload;
      const table = tableFor(keyValueStoreName);

      const sameRow = (row: Record<string, unknown>) =>
        'pk' in item && 'sk' in item ? row.pk === item.pk && row.sk === item.sk : row.id === item.id;

      const existingIndex = table.findIndex(sameRow);

      if (options?.ifNotExists && existingIndex >= 0) {
        return throwsError(askKeyValueStoreUpsertBase.errorType.Conflict, `Item already exists in ${keyValueStoreName}`);
      }

      if (existingIndex >= 0) {
        table[existingIndex] = item;
      } else {
        table.push(item);
      }

      return undefined;
    },

    [KeyValueStoreActionType.Delete]: (action: { payload: { keyValueStoreName: string; key: unknown; sortKey?: unknown } }) => {
      const { keyValueStoreName, key, sortKey } = action.payload;
      const table = tableFor(keyValueStoreName);

      const index = table.findIndex((row) => (sortKey === undefined ? row.id === key : row.pk === key && row.sk === sortKey));

      if (index >= 0) {
        table.splice(index, 1);
      }

      return undefined;
    },

    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { sortAscending?: boolean; limit?: number } };
    }) => {
      const { keyValueStoreName, keyCondition, options } = action.payload;
      const table = tableFor(keyValueStoreName);

      let items = table.filter((item) => matches(item, keyCondition));

      if ('sk' in (items[0] ?? {})) {
        items = [...items].sort((a, b) => ((a.sk as number) - (b.sk as number)) * (options?.sortAscending === false ? -1 : 1));
      }

      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      return { items, nextPageKey: undefined };
    },

    [FileActionType.ListDirectory]: (action: { payload: { drive: string; folderPath: string } }) => {
      const prefix = `${action.payload.drive}/${action.payload.folderPath}/`;

      return {
        fileInfos: Object.keys(files)
          .filter((key) => key.startsWith(prefix))
          .map((key) => ({ filepath: key.slice(action.payload.drive.length + 1), drive: action.payload.drive, isDir: false })),
        pageToken: undefined,
      };
    },

    [FileActionType.ReadBinaryContents]: (action: { payload: { drive: string; filepath: string } }) =>
      files[`${action.payload.drive}/${action.payload.filepath}`],

    [FileActionType.WriteBinaryContents]: (action: { payload: { drive: string; filepath: string; data: QPQBinaryData } }) => {
      files[`${action.payload.drive}/${action.payload.filepath}`] = action.payload.data;
      return undefined;
    },

    [FileActionType.WriteObjectJson]: (action: { payload: { drive: string; filepath: string; data: unknown } }) => {
      files[`${action.payload.drive}/${action.payload.filepath}`] = action.payload.data;
      return undefined;
    },

    [FileActionType.ReadObjectJson]: (action: { payload: { drive: string; filepath: string } }) => {
      const stored = files[`${action.payload.drive}/${action.payload.filepath}`];

      if (!stored) {
        throw new Error(`No file at ${action.payload.drive}/${action.payload.filepath}`);
      }

      return stored;
    },

    [FileActionType.GenerateTemporarySecureUrl]: (action: { payload: { drive: string; filepath: string } }) =>
      `https://${environmentName}.example.com/${action.payload.drive}/${action.payload.filepath}`,

    [FileActionType.GenerateTemporaryUploadSecureUrl]: (action: { payload: { drive: string; filepath: string } }) =>
      `https://${environmentName}.example.com/upload/${action.payload.drive}/${action.payload.filepath}`,
  };

  return { tables, files, mocks, seedDoc };
};

const httpEvent = (body: unknown): HTTPEvent => ({
  path: '/transfer',
  query: {},
  body: JSON.stringify(body),
  headers: {},
  method: 'POST',
  correlation: 'test-correlation',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

const asset = (name: string): QPQBinaryData => ({
  base64Data: Buffer.from(`bytes-of-${name}`).toString('base64'),
  filename: name,
  mimetype: 'font/woff2',
});

// A template that uses one content item and one style directly; the content item uses the SAME
// style (a diamond) plus a second one.
const seedDiamond = (environment: TestEnvironment): void => {
  environment.seedDoc(STYLE_TYPE, [initEvent('style-shared', 'shared', 'Shared style')], [{ guid: 'font-1', data: asset('brand.woff2') }]);
  environment.seedDoc(STYLE_TYPE, [initEvent('style-content', 'content-only', 'Content style')]);

  environment.seedDoc(CONTENT_TYPE, [
    initEvent('content-1', 'intro', 'Intro content'),
    event(1, 'ADD_STYLE_LINK', link(STYLE_TYPE, 'style-shared')),
    event(2, 'ADD_STYLE_LINK', link(STYLE_TYPE, 'style-content')),
  ]);

  environment.seedDoc(
    TEMPLATE_TYPE,
    [
      initEvent('template-1', 'invoice', 'Invoice template'),
      event(1, 'SET_CONTENT_LINK', link(CONTENT_TYPE, 'content-1')),
      event(2, 'ADD_STYLE_LINK', link(STYLE_TYPE, 'style-shared')),
      event(3, EventDocEffect.Publish, { documentVersion: 1, effectiveFrom: '2026-07-20T00:00:10.000Z' }),
    ],
    [{ guid: 'logo-1', data: asset('logo.png') }],
  );
};

const secondTemplateRef = { service: SERVICE, type: TEMPLATE_TYPE, id: 'template-2' };
const templateRef = { service: SERVICE, type: TEMPLATE_TYPE, id: 'template-1' };
const contentRef = { service: SERVICE, type: CONTENT_TYPE, id: 'content-1' };

const eventsFor = (environment: TestEnvironment, type: string, docId: string): EventDocEvent[] =>
  (environment.tables[eventDocEventsStoreName(storeNameForType(type))] ?? [])
    .filter((row) => row.pk === docId)
    .sort((a, b) => (a.sk as number) - (b.sk as number))
    .map((row) => row.data as EventDocEvent);

// Import localises createdBy.userId on purpose, so comparing source and target logs has to ignore it.
const withoutActorIds = (events: EventDocEvent[]): EventDocEvent[] =>
  events.map((event) => ({
    ...event,
    payload: { ...event.payload, metadata: { ...event.payload.metadata, createdBy: { ...event.payload.metadata.createdBy, userId: 'ANY' } } },
  }));

const summaryFor = (environment: TestEnvironment, type: string, docId: string): EventDocSummary =>
  (environment.tables[storeNameForType(type)] ?? []).find((row) => row.id === docId) as unknown as EventDocSummary;

describe('askEventDocManifest', () => {
  it('walks references recursively and visits a shared doc exactly once', () => {
    const source = buildEnvironment('dev');
    seedDiamond(source);

    const items = JSON.parse(runStory(manifest(httpEvent({ docs: [templateRef] })), source.mocks).body!);

    expect(items.map((item: { id: string }) => item.id)).toEqual(['template-1', 'content-1', 'style-shared', 'style-content']);
    // The diamond: style-shared is reached from both the template and the content item.
    expect(items.filter((item: { id: string }) => item.id === 'style-shared')).toHaveLength(1);
    // Discovery order is breadth-first, so reversing it is leaves-first.
    expect(items.map((item: { depth: number }) => item.depth)).toEqual([0, 1, 1, 2]);
  });

  it('terminates on a reference cycle', () => {
    const source = buildEnvironment('dev');

    source.seedDoc(CONTENT_TYPE, [initEvent('content-1', 'intro', 'Intro'), event(1, 'SET_CONTENT_LINK', link(TEMPLATE_TYPE, 'template-1'))]);
    source.seedDoc(TEMPLATE_TYPE, [initEvent('template-1', 'invoice', 'Invoice'), event(1, 'SET_CONTENT_LINK', link(CONTENT_TYPE, 'content-1'))]);

    const items = JSON.parse(runStory(manifest(httpEvent({ docs: [templateRef] })), source.mocks).body!);

    expect(items.map((item: { id: string }) => item.id)).toEqual(['template-1', 'content-1']);
  });

  it('reports a soft-deleted dependency without walking into it', () => {
    const source = buildEnvironment('dev');
    seedDiamond(source);

    const deleted = summaryFor(source, STYLE_TYPE, 'style-shared');
    deleted.deletedAt = '2026-07-25T00:00:00.000Z';

    const items = JSON.parse(runStory(manifest(httpEvent({ docs: [templateRef] })), source.mocks).body!);
    const shared = items.find((item: { id: string }) => item.id === 'style-shared');

    expect(shared.deleted).toBe(true);
  });

  it('fails loudly on a reference into another service', () => {
    const source = buildEnvironment('dev');

    source.seedDoc(TEMPLATE_TYPE, [
      initEvent('template-1', 'invoice', 'Invoice'),
      event(1, 'SET_CONTENT_LINK', { eventDocService: 'somewhere-else', eventDocType: CONTENT_TYPE, id: 'content-1', mode: EventDocLinkMode.Latest }),
    ]);

    expect(() => runStory(manifest(httpEvent({ docs: [templateRef] })), source.mocks)).toThrow(/somewhere-else/);
  });
});

describe('askEventDocManifest across several roots', () => {
  // A second template that leans on the SAME shared style as the first.
  const seedSecondTemplate = (environment: TestEnvironment): void => {
    environment.seedDoc(TEMPLATE_TYPE, [
      initEvent('template-2', 'receipt', 'Receipt template'),
      event(1, 'ADD_STYLE_LINK', link(STYLE_TYPE, 'style-shared')),
    ]);
  };

  it('merges the manifests and visits a shared dependency once', () => {
    const source = buildEnvironment('dev');
    seedDiamond(source);
    seedSecondTemplate(source);

    const items = JSON.parse(runStory(manifest(httpEvent({ docs: [templateRef, secondTemplateRef] })), source.mocks).body!);

    // Both picks are roots, and style-shared is reached from both yet appears once.
    expect(items.filter((item: { depth: number }) => item.depth === 0).map((item: { id: string }) => item.id)).toEqual(['template-1', 'template-2']);
    expect(items.filter((item: { id: string }) => item.id === 'style-shared')).toHaveLength(1);
  });

  it('bundles a multi-doc selection once, sharing the dependency', () => {
    const source = buildEnvironment('dev');
    const target = buildEnvironment('uat');
    seedDiamond(source);
    seedSecondTemplate(source);

    const result = JSON.parse(runStory(exportBundle(httpEvent({ docs: [templateRef, secondTemplateRef] })), source.mocks).body!);
    expect(result.filename).toMatch(/^template-2-docs-.*\.json$/);

    const exportedKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const bundle = source.files[exportedKey] as EventDocBundle;

    expect(bundle.docs.filter((doc) => doc.id === 'style-shared')).toHaveLength(1);
    expect(bundle.docs.map((doc) => doc.id)).toContain('template-2');

    const uploadTarget = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(uploadTarget.transferId)}`] = bundle;

    const rows = JSON.parse(runStory(importBundle(httpEvent({ transferId: uploadTarget.transferId })), target.mocks).body!);

    expect(rows.every((row: { status: string }) => row.status === EventDocTransferStatus.New)).toBe(true);
    expect(withoutActorIds(eventsFor(target, TEMPLATE_TYPE, 'template-2'))).toEqual(withoutActorIds(eventsFor(source, TEMPLATE_TYPE, 'template-2')));
  });
});

describe('eventDoc transfer round trip', () => {
  it('exports a manifest and imports it into an empty environment', () => {
    const source = buildEnvironment('dev');
    const target = buildEnvironment('uat');
    seedDiamond(source);

    const exportResult = JSON.parse(runStory(exportBundle(httpEvent({ docs: [templateRef] })), source.mocks).body!);
    expect(exportResult.items).toHaveLength(4);
    expect(exportResult.filename).toMatch(/^template-invoice-.*\.json$/);

    const exportedKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const bundle = source.files[exportedKey] as EventDocBundle;

    // Leaves first: whatever imports this sees dependencies before their referrers.
    expect(bundle.docs.map((doc) => doc.id)).toEqual(['style-content', 'style-shared', 'content-1', 'template-1']);
    expect(bundle.source.environment).toBe('dev');

    const uploadTarget = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(uploadTarget.transferId)}`] = bundle;

    const planResult = JSON.parse(runStory(plan(httpEvent({ transferId: uploadTarget.transferId })), target.mocks).body!);
    expect(planResult.source.environment).toBe('dev');
    expect(planResult.rows.map((row: { status: string }) => row.status)).toEqual(Array(4).fill(EventDocTransferStatus.New));
    // A plan writes nothing (the store was only read, so the table is present but empty).
    expect(target.tables[TEMPLATES_STORE] ?? []).toHaveLength(0);

    const importRows = JSON.parse(runStory(importBundle(httpEvent({ transferId: uploadTarget.transferId })), target.mocks).body!);
    expect(importRows.every((row: { status: string }) => row.status === EventDocTransferStatus.New)).toBe(true);
    expect(importRows.find((row: { id: string }) => row.id === 'template-1').eventsWritten).toBe(4);
    expect(importRows.find((row: { id: string }) => row.id === 'template-1').assetsWritten).toBe(1);

    // The logs match event for event APART from the actor id, which is localised on purpose.
    for (const doc of bundle.docs) {
      expect(withoutActorIds(eventsFor(target, doc.type, doc.id))).toEqual(withoutActorIds(eventsFor(source, doc.type, doc.id)));
    }

    // Attribution: the id is the importer (the source's would dangle in this directory), while the
    // author's display name survives so history still reads as the person who wrote it.
    const importedTemplateEvents = eventsFor(target, TEMPLATE_TYPE, 'template-1');
    expect(importedTemplateEvents.map((imported) => imported.payload.metadata.createdBy)).toEqual(
      importedTemplateEvents.map(() => ({ userId: 'uat-importer', userDisplayName: 'Author One' })),
    );
    expect(summaryFor(target, TEMPLATE_TYPE, 'template-1').createdBy).toBe('uat-importer');
    expect(summaryFor(target, TEMPLATE_TYPE, 'template-1').updatedBy).toBe('uat-importer');

    // Publish history survived: the summary the target derived carries the published version.
    expect(summaryFor(target, TEMPLATE_TYPE, 'template-1').versions[0].publishedAt).toBeDefined();

    // Assets landed at their original guids, so the events' EventDocAssetRefs still resolve.
    expect(target.files[`${eventDocStorageDriveName(TEMPLATES_STORE)}/${eventDocAssetPath('template-1', 'logo-1')}`]).toEqual(asset('logo.png'));
    expect(target.files[`${eventDocStorageDriveName(STYLES_STORE)}/${eventDocAssetPath('style-shared', 'font-1')}`]).toEqual(asset('brand.woff2'));
  });

  it('is idempotent: a second import of the same bundle writes nothing', () => {
    const source = buildEnvironment('dev');
    const target = buildEnvironment('uat');
    seedDiamond(source);

    const exportResult = runStory(exportBundle(httpEvent({ docs: [templateRef] })), source.mocks);
    expect(exportResult.status).toBe(200);

    const exportedKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const bundle = source.files[exportedKey] as EventDocBundle;

    const uploadTarget = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    const importKey = `${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(uploadTarget.transferId)}`;
    target.files[importKey] = bundle;

    runStory(importBundle(httpEvent({ transferId: uploadTarget.transferId })), target.mocks);

    const secondRows = JSON.parse(runStory(importBundle(httpEvent({ transferId: uploadTarget.transferId })), target.mocks).body!);

    expect(secondRows.every((row: { status: string }) => row.status === EventDocTransferStatus.Same)).toBe(true);
    expect(secondRows.every((row: { eventsWritten: number }) => row.eventsWritten === 0)).toBe(true);
  });

  it('fast-forwards a target that is behind, and refuses one that diverged', () => {
    const source = buildEnvironment('dev');
    const target = buildEnvironment('uat');
    seedDiamond(source);

    const exportOne = runStory(exportBundle(httpEvent({ docs: [templateRef] })), source.mocks);
    expect(exportOne.status).toBe(200);
    const firstKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const firstBundle = source.files[firstKey] as EventDocBundle;

    const firstUpload = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(firstUpload.transferId)}`] = firstBundle;
    runStory(importBundle(httpEvent({ transferId: firstUpload.transferId })), target.mocks);

    // The source keeps working on the template: two more events after the promotion.
    const templateEvents = source.tables[eventDocEventsStoreName(TEMPLATES_STORE)];
    const extra = event(4, 'ADD_STYLE_LINK', link(STYLE_TYPE, 'style-content'));
    templateEvents.push({ pk: 'template-1', sk: eventId(4), data: extra });
    const sourceSummaryRow = summaryFor(source, TEMPLATE_TYPE, 'template-1');
    Object.assign(sourceSummaryRow, { ...foldEventDocSummary(eventsFor(source, TEMPLATE_TYPE, 'template-1')), type: TEMPLATE_TYPE });

    delete source.files[firstKey];
    runStory(exportBundle(httpEvent({ docs: [templateRef] })), source.mocks);
    const secondKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const secondBundle = source.files[secondKey] as EventDocBundle;

    const secondUpload = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(secondUpload.transferId)}`] = secondBundle;

    const { rows } = JSON.parse(runStory(plan(httpEvent({ transferId: secondUpload.transferId })), target.mocks).body!);
    const templateRow = rows.find((row: { id: string }) => row.id === 'template-1');

    expect(templateRow.status).toBe(EventDocTransferStatus.FastForward);
    expect(templateRow.incomingEvents - templateRow.existingEvents).toBe(1);

    const applied = JSON.parse(runStory(importBundle(httpEvent({ transferId: secondUpload.transferId })), target.mocks).body!);
    expect(applied.find((row: { id: string }) => row.id === 'template-1').eventsWritten).toBe(1);
    expect(withoutActorIds(eventsFor(target, TEMPLATE_TYPE, 'template-1'))).toEqual(withoutActorIds(eventsFor(source, TEMPLATE_TYPE, 'template-1')));

    // Now someone edits the target directly: the next promotion of that doc must refuse.
    target.tables[eventDocEventsStoreName(TEMPLATES_STORE)].push({
      pk: 'template-1',
      sk: eventId(5),
      data: event(5, 'ADD_STYLE_LINK', link(STYLE_TYPE, 'style-shared')),
    });

    const { rows: divergedRows } = JSON.parse(runStory(plan(httpEvent({ transferId: secondUpload.transferId })), target.mocks).body!);
    const divergedRow = divergedRows.find((row: { id: string }) => row.id === 'template-1');

    expect(divergedRow.status).toBe(EventDocTransferStatus.Diverged);
    expect(divergedRow.detail).toMatch(/ahead/);

    const divergedApply = JSON.parse(runStory(importBundle(httpEvent({ transferId: secondUpload.transferId })), target.mocks).body!);
    expect(divergedApply.find((row: { id: string }) => row.id === 'template-1').eventsWritten).toBe(0);
  });

  it('blocks a code collision on a different doc id', () => {
    const source = buildEnvironment('dev');
    const target = buildEnvironment('uat');
    seedDiamond(source);

    // The target already has an unrelated template using the same code.
    target.seedDoc(TEMPLATE_TYPE, [initEvent('template-other', 'invoice', 'Someone else’s invoice')]);

    runStory(exportBundle(httpEvent({ docs: [templateRef] })), source.mocks);
    const exportedKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const bundle = source.files[exportedKey] as EventDocBundle;

    const uploadTarget = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(uploadTarget.transferId)}`] = bundle;

    const rows = JSON.parse(runStory(importBundle(httpEvent({ transferId: uploadTarget.transferId })), target.mocks).body!);
    const templateRow = rows.find((row: { id: string }) => row.id === 'template-1');

    expect(templateRow.status).toBe(EventDocTransferStatus.CodeConflict);
    expect(templateRow.eventsWritten).toBe(0);
    // The rest of the manifest still landed: one blocked doc does not veto the bundle.
    expect(rows.find((row: { id: string }) => row.id === 'content-1').status).toBe(EventDocTransferStatus.New);
  });

  it('overwrites a diverged doc only when forced, backing up what it discards', () => {
    const source = buildEnvironment('dev');
    const target = buildEnvironment('uat');
    seedDiamond(source);

    runStory(exportBundle(httpEvent({ docs: [templateRef] })), source.mocks);
    const exportedKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const bundle = source.files[exportedKey] as EventDocBundle;

    const upload1 = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(upload1.transferId)}`] = bundle;
    runStory(importBundle(httpEvent({ transferId: upload1.transferId })), target.mocks);

    // Someone edits the template directly in the target, replacing events 2 and 3. The edits carry
    // their OWN clientMessageId/timestamp: an event's identity is its metadata, so reusing the
    // source's would make them count as the same event and nothing would look diverged.
    const targetEdit = (index: number, styleId: string): EventDocEvent => ({
      type: 'ADD_STYLE_LINK',
      payload: {
        data: link(STYLE_TYPE, styleId),
        metadata: {
          version: 1,
          clientMessageId: `target-edit-${index}`,
          createdBy: { userId: 'uat-user', userDisplayName: 'UAT User' },
          createdAt: `2026-07-25T10:00:0${index}.000Z`,
          eventId: eventId(index),
        },
      },
    });

    const targetEvents = target.tables[eventDocEventsStoreName(TEMPLATES_STORE)];
    const templateRows = targetEvents.filter((row) => row.pk === 'template-1');
    templateRows.filter((row) => (row.sk as number) >= eventId(2)).forEach((row) => targetEvents.splice(targetEvents.indexOf(row), 1));
    targetEvents.push({ pk: 'template-1', sk: eventId(2), data: targetEdit(2, 'style-content') });
    targetEvents.push({ pk: 'template-1', sk: eventId(3), data: targetEdit(3, 'style-shared') });

    const upload2 = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(upload2.transferId)}`] = bundle;

    // Unforced: reported and left alone.
    const unforced = JSON.parse(runStory(importBundle(httpEvent({ transferId: upload2.transferId })), target.mocks).body!);
    const unforcedRow = unforced.find((row: { id: string }) => row.id === 'template-1');
    expect(unforcedRow.status).toBe(EventDocTransferStatus.Diverged);
    expect(unforcedRow.eventsWritten).toBe(0);

    // Forced: the divergent tail is backed up, dropped, and the bundle's version written over it.
    const forced = JSON.parse(runStory(importBundle(httpEvent({ transferId: upload2.transferId, force: true })), target.mocks).body!);
    const forcedRow = forced.find((row: { id: string }) => row.id === 'template-1');

    expect(forcedRow.status).toBe(EventDocTransferStatus.Overwritten);
    expect(forcedRow.discardedEvents).toBe(2);
    expect(forcedRow.eventsWritten).toBe(2);

    // The log now matches the source exactly.
    expect(withoutActorIds(eventsFor(target, TEMPLATE_TYPE, 'template-1'))).toEqual(withoutActorIds(eventsFor(source, TEMPLATE_TYPE, 'template-1')));

    // And what was thrown away is recoverable off the transfer drive.
    const discarded = target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferDiscardedPath(upload2.transferId, 'template-1')}`] as {
      discardedFromIndex: number;
      events: EventDocEvent[];
    };

    expect(discarded.discardedFromIndex).toBe(2);
    expect(discarded.events.map((discardedEvent) => discardedEvent.payload.metadata.eventId)).toEqual([eventId(2), eventId(3)]);
  });

  it('blocks a rename that would collide with a sibling, not just a new doc', () => {
    // The case a new-docs-only code check misses: this doc ALREADY exists in the target and
    // fast-forwards cleanly, but the incoming tail renames it onto a code a sibling holds. Letting it
    // through would leave two docs on one code, and askEventDocGetByCode throws on more than one
    // match - so both docs become unlookupable.
    const source = buildEnvironment('dev');
    const target = buildEnvironment('uat');

    source.seedDoc(TEMPLATE_TYPE, [initEvent('template-1', 'invoice', 'Invoice')]);
    target.seedDoc(TEMPLATE_TYPE, [initEvent('template-1', 'invoice', 'Invoice')]);
    // The sibling already owns the code the rename is heading for.
    target.seedDoc(TEMPLATE_TYPE, [initEvent('template-other', 'receipt', 'Receipt')]);

    // dev renames its template onto the sibling's code.
    source.tables[eventDocEventsStoreName(TEMPLATES_STORE)].push({
      pk: 'template-1',
      sk: eventId(1),
      data: event(1, EventDocEffect.SetCode, { code: 'receipt' }),
    });
    Object.assign(summaryFor(source, TEMPLATE_TYPE, 'template-1'), {
      ...foldEventDocSummary(eventsFor(source, TEMPLATE_TYPE, 'template-1')),
      type: TEMPLATE_TYPE,
    });

    runStory(exportBundle(httpEvent({ docs: [templateRef] })), source.mocks);
    const exportedKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const bundle = source.files[exportedKey] as EventDocBundle;

    const uploadTarget = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(uploadTarget.transferId)}`] = bundle;

    const rows = JSON.parse(runStory(importBundle(httpEvent({ transferId: uploadTarget.transferId })), target.mocks).body!);
    const templateRow = rows.find((row: { id: string }) => row.id === 'template-1');

    expect(templateRow.status).toBe(EventDocTransferStatus.CodeConflict);
    expect(templateRow.detail).toContain('template-other');
    expect(templateRow.eventsWritten).toBe(0);
    // The rename never landed, so the target's own log is untouched.
    expect(eventsFor(target, TEMPLATE_TYPE, 'template-1')).toHaveLength(1);
  });

  it('never overwrites a code conflict, even when forced', () => {
    const source = buildEnvironment('dev');
    const target = buildEnvironment('uat');
    seedDiamond(source);
    target.seedDoc(TEMPLATE_TYPE, [initEvent('template-other', 'invoice', 'Someone else’s invoice')]);

    runStory(exportBundle(httpEvent({ docs: [templateRef] })), source.mocks);
    const exportedKey = Object.keys(source.files).find((key) => key.startsWith(`${EVENT_DOC_TRANSFER_DRIVE_NAME}/exports/`))!;
    const bundle = source.files[exportedKey] as EventDocBundle;

    const uploadTarget = JSON.parse(runStory(upload(httpEvent({})), target.mocks).body!);
    target.files[`${EVENT_DOC_TRANSFER_DRIVE_NAME}/${eventDocTransferImportPath(uploadTarget.transferId)}`] = bundle;

    const rows = JSON.parse(runStory(importBundle(httpEvent({ transferId: uploadTarget.transferId, force: true })), target.mocks).body!);
    const templateRow = rows.find((row: { id: string }) => row.id === 'template-1');

    // Overwriting this doc's own tail would not free the code, so force must not touch it.
    expect(templateRow.status).toBe(EventDocTransferStatus.CodeConflict);
    expect(templateRow.eventsWritten).toBe(0);
  });
});
