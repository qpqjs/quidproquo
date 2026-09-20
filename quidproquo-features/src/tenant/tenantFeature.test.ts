import {
  askKeyValueStoreUpsertBase,
  ConfigActionType,
  ContextActionType,
  DateActionType,
  DynamicFunctionsActionType,
  FileActionType,
  GuidActionType,
  InlineFunctionActionType,
  KeyValueStoreActionType,
  KvsLogicalOperator,
  KvsLogicalOperatorType,
  KvsQueryCondition,
  KvsQueryOperation,
  KvsQueryOperationType,
  QpqContextIdentifier,
  runStory,
  storageScopeContext,
  throwsError,
  UserDirectoryActionType,
} from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import {
  EVENT_DOC_AUTHORISER_GLOBAL,
  EVENT_DOC_EVENTS_STORE_NAME_GLOBAL,
  EVENT_DOC_ON_PUBLISH_GLOBAL,
  EVENT_DOC_SCOPE_RESOLVER_GLOBAL,
  EVENT_DOC_STORE_NAME_GLOBAL,
  EVENT_DOC_TYPE_GLOBAL,
  EVENT_DOC_USER_DIRECTORY_GLOBAL,
} from '../eventDoc/constants/eventDocGlobalNames';
import { buildEventDocStore } from '../eventDoc/context/buildEventDocStore';
import { EventDocEffect, EventDocEvent, EventDocOnPublishInput } from '../eventDoc/models';
import { appendEvent } from '../eventDoc/routes/controllers/appendEvent';
import { createKvsUpdateMock } from '../eventDoc/testing/kvsUpdateActionMock';
import { toQpqPermission } from '../permission/logic/toQpqPermission';
import { TENANT_ADMIN_ROLE } from './constants/tenantAdminRole';
import { DEFAULT_TENANT_HEADER_NAME, TENANT_HEADER_NAME_GLOBAL, TENANT_ROLES_GLOBAL } from './constants/tenantGlobalNames';
import {
  TENANT_DOC_TYPE,
  TENANT_EVENT_DOC_AUTHORISER_FN,
  TENANT_EVENTDOC_STORE,
  TENANT_MEMBERSHIPS_STORE,
  TENANT_ON_PUBLISH_FN,
  TENANT_RECORD_STORE,
  TENANT_SCOPE_RESOLVER_FN,
} from './constants/tenantStoreNames';
import { TenantEffect } from './fold/TenantEffect';
import { askTenantOnPublish } from './logic/askTenantOnPublish';
import { askTenantResolveActiveTenant } from './logic/askTenantResolveActiveTenant';
import { buildTenantRoleCatalog } from './logic/roles/buildTenantRoleCatalog';
import { TenantStatus } from './models/TenantStatus';
import { tenantRegistryEventDoc } from './module/tenantRegistryEventDoc';
import { addMember } from './routes/controllers/addMember';
import { create } from './routes/controllers/create';
import { get } from './routes/controllers/get';
import { getLogo } from './routes/controllers/getLogo';
import { getMembership } from './routes/controllers/getMembership';
import { list } from './routes/controllers/list';
import { listMembers } from './routes/controllers/listMembers';
import { listRoles } from './routes/controllers/listRoles';
import { removeMember } from './routes/controllers/removeMember';
import { setMemberRoles } from './routes/controllers/setMemberRoles';
import { updateMember } from './routes/controllers/updateMember';

let sortableGuidCount = 0;

// End-to-end story-level pass over the tenant feature: create links membership,
// SET_BRAND + PUBLISH materializes the record via the onPublish sync, list/get
// serve the record store, and the per-request tenant gate validates membership.
// The tenant collection is an ordinary tenanted collection - every route runs
// under the standard request scope (emulated by the Execute mock below), so a
// created tenant doc lands in the caller's own partition.

const store = buildEventDocStore({
  storeName: TENANT_EVENTDOC_STORE,
  type: TENANT_DOC_TYPE,
  onPublish: TENANT_ON_PUBLISH_FN,
  scopeResolver: TENANT_SCOPE_RESOLVER_FN,
});

const globals: Record<string, unknown> = {
  [EVENT_DOC_STORE_NAME_GLOBAL]: store.storeName,
  [EVENT_DOC_EVENTS_STORE_NAME_GLOBAL]: store.eventsStoreName,
  [EVENT_DOC_TYPE_GLOBAL]: store.type,
  [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'test-user-directory',
  [EVENT_DOC_ON_PUBLISH_GLOBAL]: TENANT_ON_PUBLISH_FN,
  [EVENT_DOC_SCOPE_RESOLVER_GLOBAL]: TENANT_SCOPE_RESOLVER_FN,
  [EVENT_DOC_AUTHORISER_GLOBAL]: TENANT_EVENT_DOC_AUTHORISER_FN,
  [TENANT_HEADER_NAME_GLOBAL]: DEFAULT_TENANT_HEADER_NAME,
  [TENANT_ROLES_GLOBAL]: buildTenantRoleCatalog({
    approver: { code: 'approver', name: 'Approver', permissions: [toQpqPermission('case:approve')] },
  }),
};

const isCondition = (op: KvsQueryOperation): op is KvsQueryCondition => 'key' in op;

const matches = (item: Record<string, unknown>, op: KvsQueryOperation): boolean => {
  if (isCondition(op)) {
    const actual = item[op.key];
    switch (op.operation) {
      case KvsQueryOperationType.Equal:
        return actual === op.valueA;
      case KvsQueryOperationType.GreaterThan:
        return typeof actual === typeof op.valueA && (actual as string | number) > (op.valueA as string | number);
      case KvsQueryOperationType.LessThanOrEqual:
        return typeof actual === typeof op.valueA && (actual as string | number) <= (op.valueA as string | number);
      default:
        throw new Error(`Test KVS mock does not support operator: ${op.operation}`);
    }
  }

  const logical = op as KvsLogicalOperator;
  if (logical.operation === KvsLogicalOperatorType.And) {
    return logical.conditions.every((c) => matches(item, c));
  }
  throw new Error(`Test KVS mock does not support logical operator: ${logical.operation}`);
};

const buildMocks = () => {
  const tables: Record<string, Record<string, unknown>[]> = {};
  const inlinePayloads: EventDocOnPublishInput[] = [];
  const upsertScopes: { store: string; scope?: string }[] = [];
  let guidCounter = 0;
  let clock = Date.parse('2026-07-11T00:00:00.000Z');

  // Row identity per store: the events store keys pk/sk, the summary store id,
  // the record store tenantId, the membership stores (tenantId, userId).
  const sameRow = (item: Record<string, unknown>) => (row: Record<string, unknown>) => {
    if ('pk' in item && 'sk' in item) return row.pk === item.pk && row.sk === item.sk;
    if ('tenantId' in item && 'userId' in item) return row.tenantId === item.tenantId && row.userId === item.userId;
    if ('tenantId' in item) return row.tenantId === item.tenantId;
    if ('userId' in item) return row.userId === item.userId;
    return row.id === item.id;
  };

  // A membership row.
  const membershipRow = (tenantId: string, userId: string, roles: string[], extra: Record<string, unknown> = {}) => ({
    tenantId,
    userId,
    roles,
    grants: [],
    joinedAt: '2026-07-10T00:00:00.000Z',
    addedByUserId: userId,
    rolesUpdatedAt: '2026-07-10T00:00:00.000Z',
    rolesUpdatedByUserId: userId,
    ...extra,
  });
  const seedMembership = (tenantId: string, userId: string, roles: string[], extra: Record<string, unknown> = {}) => {
    (tables[TENANT_MEMBERSHIPS_STORE] ??= []).push(membershipRow(tenantId, userId, roles, extra));
  };

  const mocks = {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',

    [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-1', username: 'joe', exp: 0, userDirectory: 'test-user-directory', wasValid: true },

    [DateActionType.Now]: () => new Date((clock += 1000)).toISOString(),
    [GuidActionType.New]: () => `guid-${++guidCounter}`,

    // Sortable ids must sort lexicographically in creation order; pad so they do.
    [GuidActionType.NewSortable]: () => `sguid-${String(++sortableGuidCount).padStart(4, '0')}`,
    // The registered tenant registry definition, invoked for real: the hook-state
    // derivation folds the document through it, so the hook payload carries the true
    // TenantDocument state (brand, logo) rather than a stub.
    [DynamicFunctionsActionType.Execute]: (action: { payload: { functionName: string; args: [never, never] } }) => {
      if (action.payload.functionName === 'foldDocumentState') {
        return tenantRegistryEventDoc.foldDocumentState(action.payload.args[0], action.payload.args[1]);
      }
      if (action.payload.functionName === 'validateEvent') {
        return tenantRegistryEventDoc.validateEvent(action.payload.args[0], action.payload.args[1]);
      }
      throw new Error(`Unexpected dynamic function: ${action.payload.functionName}`);
    },

    [InlineFunctionActionType.Execute]: (action: { payload: { functionName: string; payload: unknown } }) => {
      // Emulate the standard request-scope resolver: header names a tenant ->
      // that tenant's scope; no header -> the caller's personal scope.
      if (action.payload.functionName === TENANT_SCOPE_RESOLVER_FN) {
        const { event } = action.payload.payload as { event: HTTPEvent };
        const headerTenantId = event.headers?.[DEFAULT_TENANT_HEADER_NAME];
        return headerTenantId ? `TENANT#${headerTenantId}` : 'PERSONAL#user-1';
      }

      // The authoriser is unit-tested on its own; here every collection route is allowed.
      if (action.payload.functionName === TENANT_EVENT_DOC_AUTHORISER_FN) {
        return undefined;
      }

      inlinePayloads.push(action.payload.payload as EventDocOnPublishInput);
      return undefined;
    },

    [KeyValueStoreActionType.Get]: (action: { payload: { keyValueStoreName: string; key: string } }) => {
      const table = tables[action.payload.keyValueStoreName] ?? [];
      return table.find((row) => row.tenantId === action.payload.key || row.userId === action.payload.key || row.id === action.payload.key) ?? null;
    },

    [KeyValueStoreActionType.Update]: createKvsUpdateMock({
      tableFor: (_scope, storeName) => (tables[storeName] ??= []),
      keyName: 'type',
      sortKeyName: 'id',
    }),

    [KeyValueStoreActionType.Upsert]: (action: {
      payload: { keyValueStoreName: string; item: Record<string, unknown>; options?: { ifNotExists?: boolean; scope?: string } };
    }) => {
      const { keyValueStoreName, item, options } = action.payload;
      upsertScopes.push({ store: keyValueStoreName, scope: options?.scope });
      const table = (tables[keyValueStoreName] ??= []);
      const existingIndex = table.findIndex(sameRow(item));

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

    [KeyValueStoreActionType.Delete]: (action: { payload: { keyValueStoreName: string; key: string; sortKey?: string } }) => {
      const { keyValueStoreName, key, sortKey } = action.payload;
      const table = tables[keyValueStoreName] ?? [];
      const index = table.findIndex((row) =>
        keyValueStoreName === TENANT_MEMBERSHIPS_STORE
          ? row.userId === key && row.tenantId === sortKey
          : row.tenantId === key || row.userId === key || row.id === key,
      );
      if (index >= 0) {
        table.splice(index, 1);
      }
      return undefined;
    },

    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: { sortAscending?: boolean; limit?: number } };
    }) => {
      const { keyValueStoreName, keyCondition, options } = action.payload;
      const table = tables[keyValueStoreName] ?? [];

      let items = table.filter((item) => matches(item, keyCondition));

      if ('sk' in (items[0] ?? {})) {
        items = [...items].sort((a, b) => String(a.sk).localeCompare(String(b.sk)) * (options?.sortAscending === false ? -1 : 1));
      }

      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      return { items, nextPageKey: undefined };
    },
  };

  return { mocks, tables, inlinePayloads, upsertScopes, seedMembership, membershipRow };
};

const httpEvent = (body: unknown, headers: Record<string, string> = {}): HTTPEvent => ({
  path: '/tenants',
  query: {},
  body: JSON.stringify(body),
  headers,
  method: 'POST',
  correlation: 'test-correlation',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

describe('tenant feature', () => {
  it('creates a tenant, links membership, materializes the record on publish, and serves it back', () => {
    const { mocks, tables, inlinePayloads, upsertScopes } = buildMocks();

    // Create: the caller becomes the first member.
    const createResponse = runStory(create(httpEvent({ name: 'credit-corp' })), mocks);
    expect(createResponse.status).toBe(200);
    const summary = JSON.parse(createResponse.body!);

    // Create: the caller becomes the first ADMIN.
    const ownerRow = { tenantId: summary.id, userId: 'user-1', roles: [TENANT_ADMIN_ROLE], grants: [], addedByUserId: 'user-1' };
    expect(tables[TENANT_MEMBERSHIPS_STORE]).toEqual([expect.objectContaining(ownerRow)]);

    // The doc + its INIT event land in the TENANT'S OWN partition, whatever scope the
    // request ran under. The membership link is the unscoped cross-scope registry.
    const tenantScope = `TENANT#${summary.id}`;
    const docWrites = upsertScopes.filter(({ store }) => store !== TENANT_MEMBERSHIPS_STORE);
    expect(docWrites.length).toBeGreaterThan(0);
    expect(docWrites.every(({ scope }) => scope === tenantScope)).toBe(true);
    expect(upsertScopes.find(({ store }) => store === TENANT_MEMBERSHIPS_STORE)?.scope).toBeUndefined();

    // The list serves the created tenant IMMEDIATELY (live summary from the tenant's
    // own scope, drafts included) - a never-published tenant must be reopenable to
    // finish setup.
    const draftListResponse = runStory(list(httpEvent(undefined)), mocks);
    const draftList = JSON.parse(draftListResponse.body!);
    expect(draftList).toHaveLength(1);
    expect(draftList[0]).toMatchObject({ id: summary.id, name: 'credit-corp' });

    // Brand it, then publish (through the generic eventDoc append route), from INSIDE
    // the tenant: the doc lives in its own scope, so the request names it.
    const inTenant = { [DEFAULT_TENANT_HEADER_NAME]: summary.id };
    const brandResponse = runStory(
      appendEvent(
        httpEvent(
          {
            type: TenantEffect.setBrand,
            payload: {
              data: {
                brandColors: { primary: '#123456', secondary: '#abcdef' },
                logo: { guid: 'logo-guid', filename: 'logo.png', mimetype: 'image/png' },
                displayName: 'Credit Corp',
              },
              metadata: { version: 1, clientMessageId: 'msg-1' },
            },
          },
          inTenant,
        ),
        { id: summary.id },
      ),
      mocks,
    );
    expect(brandResponse.status).toBe(200);

    const publishResponse = runStory(
      appendEvent(
        httpEvent(
          {
            type: EventDocEffect.Publish,
            payload: { data: { effectiveFrom: '2026-07-11T00:00:00.000Z' }, metadata: { version: 1, clientMessageId: 'msg-2' } },
          },
          inTenant,
        ),
        { id: summary.id },
      ),
      mocks,
    );
    expect(publishResponse.status).toBe(200);

    // The hook fired through the inline-function boundary; run the real sync with the
    // exact payload it received. In production the inline function executes inside the
    // append's session, so the store context is inherited; here it is mocked.
    expect(inlinePayloads).toHaveLength(1);
    runStory(askTenantOnPublish(inlinePayloads[0]), {
      ...mocks,
      [ContextActionType.Read]: store,
    });

    const records = tables[TENANT_RECORD_STORE];
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      tenantId: summary.id,
      name: 'credit-corp',
      brandColors: { primary: '#123456', secondary: '#abcdef' },
      logo: { guid: 'logo-guid', filename: 'logo.png', mimetype: 'image/png' },
      displayName: 'Credit Corp',
      createdByUserId: 'user-1',
      status: TenantStatus.active,
    });

    // The list serves EventDocSummary rows; get serves the materialized record.
    const listResponse = runStory(list(httpEvent(undefined)), mocks);
    const listed = JSON.parse(listResponse.body!);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ id: summary.id, name: 'credit-corp' });
    expect(listed[0].versions).toBeDefined();

    const getResponse = runStory(get(httpEvent(undefined), { id: summary.id }), mocks);
    expect(JSON.parse(getResponse.body!).name).toBe('credit-corp');
  });

  it('excludes soft-deleted tenants from the list', () => {
    const { mocks, tables } = buildMocks();

    const createResponse = runStory(create(httpEvent({ name: 'credit-corp' })), mocks);
    const summary = JSON.parse(createResponse.body!);

    // Soft-delete the summary row directly (the remove route folds to the same shape).
    const summaryRow = tables[TENANT_EVENTDOC_STORE].find((row) => row.id === summary.id)!;
    summaryRow.deletedAt = '2026-07-11T01:00:00.000Z';

    const listResponse = runStory(list(httpEvent(undefined)), mocks);
    expect(JSON.parse(listResponse.body!)).toEqual([]);
  });

  it('hydrates every membership from the tenant doc in its own scope, whoever created it', () => {
    const { mocks, tables, seedMembership, upsertScopes } = buildMocks();

    // user-2 creates a tenant; user-1 is then added as a member and lists it.
    const created = JSON.parse(
      runStory(create(httpEvent({ name: 'acme' })), { ...mocks, [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-2' } }).body!,
    );
    seedMembership(created.id, 'user-1', []);
    // A membership whose tenant doc does not exist is not listed.
    seedMembership('tenant-missing', 'user-1', []);

    const listed = JSON.parse(runStory(list(httpEvent(undefined)), mocks).body!);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ id: created.id, name: 'acme', createdBy: 'user-2' });
    expect(upsertScopes.filter(({ store }) => store === TENANT_EVENTDOC_STORE).every(({ scope }) => scope === `TENANT#${created.id}`)).toBe(true);
    expect(tables[TENANT_RECORD_STORE]).toBeUndefined();
  });

  it('gates requests on membership of the claimed tenant header', () => {
    const { mocks, seedMembership } = buildMocks();
    seedMembership('tenant-a', 'user-1', []);

    const resolved = runStory(askTenantResolveActiveTenant(httpEvent(undefined, { [DEFAULT_TENANT_HEADER_NAME]: 'tenant-a' })), mocks);
    expect(resolved).toBe('tenant-a');

    expect(() => runStory(askTenantResolveActiveTenant(httpEvent(undefined, { [DEFAULT_TENANT_HEADER_NAME]: 'tenant-b' })), mocks)).toThrow(
      /not a member/,
    );

    expect(() => runStory(askTenantResolveActiveTenant(httpEvent(undefined)), mocks)).toThrow(/Missing tenant header/);
  });

  it('denies get for a tenant the user is not a member of', () => {
    const { mocks, seedMembership } = buildMocks();
    seedMembership('tenant-a', 'user-1', []);

    expect(() => runStory(get(httpEvent(undefined), { id: 'tenant-b' }), mocks)).toThrow(/not a member/);
  });

  describe('members', () => {
    const directory: Record<string, { userId: string; email: string; name?: string }> = {
      'user-1': { userId: 'user-1', email: 'joe@example.com', name: 'Joe' },
      'user-2': { userId: 'user-2', email: 'sam@example.com', name: 'Sam' },
    };

    const withDirectoryMocks = (mocks: Record<string, unknown>) => ({
      ...mocks,
      [UserDirectoryActionType.GetUsersByAttribute]: (action: { payload: { attribueName: string; attribueValue: string } }) => ({
        items: Object.values(directory).filter((user) => user[action.payload.attribueName as 'email'] === action.payload.attribueValue),
      }),
      [UserDirectoryActionType.GetUserAttributesByUserId]: (action: { payload: { userId: string } }) => {
        const user = directory[action.payload.userId];
        if (!user) {
          return throwsError('UserNotFound', `No user: ${action.payload.userId}`);
        }
        return user;
      },
    });

    const membersOf = (response: { body?: string }) => JSON.parse(response.body!).items as { userId: string; roles: string[]; disabled: boolean }[];

    it('adds an existing user by email as a member, lists, updates, and removes', () => {
      const { mocks: baseMocks, tables } = buildMocks();
      const mocks = withDirectoryMocks(baseMocks);

      const createResponse = runStory(create(httpEvent({ name: 'credit-corp' })), mocks);
      const summary = JSON.parse(createResponse.body!);

      // Email lookup is case/whitespace-insensitive; the member comes back hydrated.
      const addResponse = runStory(addMember(httpEvent({ email: '  Sam@Example.com ' }), { id: summary.id }), mocks);
      expect(addResponse.status).toBe(200);
      expect(JSON.parse(addResponse.body!)).toMatchObject({
        userId: 'user-2',
        email: 'sam@example.com',
        name: 'Sam',
        roles: [],
        disabled: false,
      });

      const samRow = { tenantId: summary.id, userId: 'user-2', roles: [], grants: [], addedByUserId: 'user-1' };
      expect(tables[TENANT_MEMBERSHIPS_STORE]).toContainEqual(expect.objectContaining(samRow));

      // Idempotent: re-adding does not duplicate the row.
      runStory(addMember(httpEvent({ email: 'sam@example.com' }), { id: summary.id }), mocks);
      expect(tables[TENANT_MEMBERSHIPS_STORE]).toHaveLength(2);

      const listResponse = runStory(listMembers(httpEvent(undefined), { id: summary.id }), mocks);
      expect(membersOf(listResponse)).toEqual([
        expect.objectContaining({ userId: 'user-1', email: 'joe@example.com', name: 'Joe', roles: [TENANT_ADMIN_ROLE], disabled: false }),
        expect.objectContaining({ userId: 'user-2', email: 'sam@example.com', name: 'Sam', roles: [], disabled: false }),
      ]);

      // Disable Sam: still listed, but no longer passes the access check.
      const disableResponse = runStory(updateMember(httpEvent({ disabled: true }), { id: summary.id, userId: 'user-2' }), mocks);
      expect(disableResponse.status).toBe(200);
      expect(membersOf(runStory(listMembers(httpEvent(undefined), { id: summary.id }), mocks))).toContainEqual(
        expect.objectContaining({ userId: 'user-2', disabled: true }),
      );
      expect(tables[TENANT_MEMBERSHIPS_STORE]).toContainEqual(expect.objectContaining({ userId: 'user-2', disabled: true }));

      // Re-enable Sam.
      runStory(updateMember(httpEvent({ disabled: false }), { id: summary.id, userId: 'user-2' }), mocks);
      expect(tables[TENANT_MEMBERSHIPS_STORE]).toContainEqual(expect.objectContaining({ userId: 'user-2', disabled: false }));

      const removeResponse = runStory(removeMember(httpEvent(undefined), { id: summary.id, userId: 'user-2' }), mocks);
      expect(removeResponse.status).toBe(200);
      expect(tables[TENANT_MEMBERSHIPS_STORE]).toEqual([expect.objectContaining({ userId: 'user-1' })]);
    });

    it('lists a member the directory no longer knows with null details', () => {
      const { mocks: baseMocks, seedMembership } = buildMocks();
      const mocks = withDirectoryMocks(baseMocks);

      seedMembership('tenant-a', 'user-1', [TENANT_ADMIN_ROLE]);
      seedMembership('tenant-a', 'user-gone', []);

      const listResponse = runStory(listMembers(httpEvent(undefined), { id: 'tenant-a' }), mocks);
      expect(membersOf(listResponse)).toEqual([
        expect.objectContaining({ userId: 'user-1', email: 'joe@example.com', name: 'Joe' }),
        expect.objectContaining({ userId: 'user-gone', email: null, name: null }),
      ]);
    });

    it('rejects an email with no account, self-disable, and taking out the last assigner', () => {
      const { mocks: baseMocks, tables } = buildMocks();
      const mocks = withDirectoryMocks(baseMocks);

      const createResponse = runStory(create(httpEvent({ name: 'credit-corp' })), mocks);
      const summary = JSON.parse(createResponse.body!);

      expect(() => runStory(addMember(httpEvent({ email: 'nobody@example.com' }), { id: summary.id }), mocks)).toThrow(/No user account/);
      expect(() => runStory(addMember(httpEvent({}), { id: summary.id }), mocks)).toThrow(/email address is required/);
      expect(() => runStory(updateMember(httpEvent({ disabled: true }), { id: summary.id, userId: 'user-1' }), mocks)).toThrow(/disable yourself/);
      expect(() => runStory(updateMember(httpEvent({ disabled: 'yes' }), { id: summary.id, userId: 'user-1' }), mocks)).toThrow(/must be a boolean/);
      expect(() => runStory(removeMember(httpEvent(undefined), { id: summary.id, userId: 'user-1' }), mocks)).toThrow(/last member who can assign/);
      expect(tables[TENANT_MEMBERSHIPS_STORE]).toEqual([expect.objectContaining({ userId: 'user-1', roles: [TENANT_ADMIN_ROLE] })]);

      // A second admin makes the first removable; disabling the only remaining one is refused.
      runStory(addMember(httpEvent({ email: 'sam@example.com' }), { id: summary.id }), mocks);
      expect(() => runStory(removeMember(httpEvent(undefined), { id: summary.id, userId: 'user-1' }), mocks)).toThrow(/last member who can assign/);
      tables[TENANT_MEMBERSHIPS_STORE].find((row) => row.userId === 'user-2')!.roles = [TENANT_ADMIN_ROLE];
      runStory(removeMember(httpEvent(undefined), { id: summary.id, userId: 'user-1' }), mocks);
      expect(tables[TENANT_MEMBERSHIPS_STORE]).toEqual([expect.objectContaining({ userId: 'user-2' })]);
    });

    it('lets members list but only enabled members holding MembersManage add, update or remove users', () => {
      const { mocks: baseMocks, tables, seedMembership } = buildMocks();
      const mocks = withDirectoryMocks(baseMocks);

      // user-2 administers tenant-a; the caller (user-1) is merely a member.
      seedMembership('tenant-a', 'user-2', [TENANT_ADMIN_ROLE]);
      seedMembership('tenant-a', 'user-1', []);

      expect(membersOf(runStory(listMembers(httpEvent(undefined), { id: 'tenant-a' }), mocks))).toHaveLength(2);

      // The regression: a member must not manage (or evict the owner from) a tenant they don't own.
      expect(() => runStory(addMember(httpEvent({ email: 'sam@example.com' }), { id: 'tenant-a' }), mocks)).toThrow(/permission to manage members/);
      expect(() => runStory(updateMember(httpEvent({ disabled: true }), { id: 'tenant-a', userId: 'user-2' }), mocks)).toThrow(
        /permission to manage members/,
      );
      expect(() => runStory(removeMember(httpEvent(undefined), { id: 'tenant-a', userId: 'user-2' }), mocks)).toThrow(/permission to manage members/);
      expect(tables[TENANT_MEMBERSHIPS_STORE]).toHaveLength(2);

      // A DISABLED admin is no admin (and no member) until re-enabled.
      seedMembership('tenant-c', 'user-1', [TENANT_ADMIN_ROLE], { disabled: true });
      expect(() => runStory(listMembers(httpEvent(undefined), { id: 'tenant-c' }), mocks)).toThrow(/not a member/);
      expect(() => runStory(addMember(httpEvent({ email: 'sam@example.com' }), { id: 'tenant-c' }), mocks)).toThrow(/permission to manage members/);
      expect(runStory(askTenantResolveActiveTenant(httpEvent(undefined, { [DEFAULT_TENANT_HEADER_NAME]: 'tenant-a' })), mocks)).toBe('tenant-a');
      expect(() => runStory(askTenantResolveActiveTenant(httpEvent(undefined, { [DEFAULT_TENANT_HEADER_NAME]: 'tenant-c' })), mocks)).toThrow(
        /not a member/,
      );

      // Non-members get nothing at all.
      expect(() => runStory(listMembers(httpEvent(undefined), { id: 'tenant-b' }), mocks)).toThrow(/not a member/);
      expect(() => runStory(addMember(httpEvent({ email: 'sam@example.com' }), { id: 'tenant-b' }), mocks)).toThrow(/permission to manage members/);
    });

    describe('roles', () => {
      const rolesEvent = (roles: string[], grants: unknown[] = []) => httpEvent({ roles, grants });

      it('assigners set roles and grants; the caller reads back the permissions they expand to', () => {
        const { mocks: baseMocks, tables } = buildMocks();
        const mocks = withDirectoryMocks(baseMocks);

        const summary = JSON.parse(runStory(create(httpEvent({ name: 'credit-corp' })), mocks).body!);
        runStory(addMember(httpEvent({ email: 'sam@example.com' }), { id: summary.id }), mocks);

        const grant = { permission: 'case:approve', selector: { kind: 'ids', ids: ['case-1'] } };
        const setResponse = runStory(setMemberRoles(rolesEvent(['approver'], [grant]), { id: summary.id, userId: 'user-2' }), mocks);
        expect(setResponse.status).toBe(200);
        expect(tables[TENANT_MEMBERSHIPS_STORE]).toContainEqual(
          expect.objectContaining({ userId: 'user-2', roles: ['approver'], grants: [grant], rolesUpdatedByUserId: 'user-1' }),
        );

        // The caller's own membership carries the expanded permission list.
        const mine = JSON.parse(runStory(getMembership(httpEvent(undefined), { id: summary.id }), mocks).body!);
        expect(mine.roles).toEqual([TENANT_ADMIN_ROLE]);
        expect(mine.permissions).toEqual(expect.arrayContaining(['tenant:members:manage', 'tenant:roles:assign', 'eventDoc:tenants:write']));
        expect(mine.permissions).not.toContain('case:approve');

        // The catalog as a pick list.
        const options = JSON.parse(runStory(listRoles(httpEvent(undefined), { id: summary.id }), mocks).body!);
        expect(options).toEqual(
          expect.arrayContaining([
            { code: 'approver', name: 'Approver' },
            { code: TENANT_ADMIN_ROLE, name: 'Tenant admin' },
          ]),
        );
      });

      it('rejects unknown roles, malformed grants, and non-assigners', () => {
        const { mocks: baseMocks, seedMembership } = buildMocks();
        const mocks = withDirectoryMocks(baseMocks);

        seedMembership('tenant-a', 'user-1', [TENANT_ADMIN_ROLE]);
        seedMembership('tenant-a', 'user-2', []);

        expect(() => runStory(setMemberRoles(rolesEvent(['boss']), { id: 'tenant-a', userId: 'user-2' }), mocks)).toThrow(/Unknown role/);
        expect(() =>
          runStory(
            setMemberRoles(rolesEvent([], [{ permission: 'approve', selector: { kind: 'all' } }]), { id: 'tenant-a', userId: 'user-2' }),
            mocks,
          ),
        ).toThrow(/permission key/);
        expect(() =>
          runStory(
            setMemberRoles(rolesEvent([], [{ permission: 'case:approve', selector: { kind: 'some' } }]), { id: 'tenant-a', userId: 'user-2' }),
            mocks,
          ),
        ).toThrow();
        expect(() => runStory(setMemberRoles(rolesEvent(['approver']), { id: 'tenant-a', userId: 'user-9' }), mocks)).toThrow(/not a member/);

        // user-2 holds nothing, so cannot assign.
        seedMembership('tenant-b', 'user-2', [TENANT_ADMIN_ROLE]);
        seedMembership('tenant-b', 'user-1', []);
        expect(() => runStory(setMemberRoles(rolesEvent(['approver']), { id: 'tenant-b', userId: 'user-2' }), mocks)).toThrow(
          /permission to assign roles/,
        );
      });

      it('never strips the last assigner, and lets a member leave', () => {
        const { mocks: baseMocks, tables, seedMembership } = buildMocks();
        const mocks = withDirectoryMocks(baseMocks);

        seedMembership('tenant-a', 'user-1', [TENANT_ADMIN_ROLE]);
        seedMembership('tenant-a', 'user-2', []);

        expect(() => runStory(setMemberRoles(rolesEvent(['approver']), { id: 'tenant-a', userId: 'user-1' }), mocks)).toThrow(
          /last member who can assign/,
        );

        // Hand admin to user-2, then user-1 may step down and leave.
        runStory(setMemberRoles(rolesEvent([TENANT_ADMIN_ROLE]), { id: 'tenant-a', userId: 'user-2' }), mocks);
        runStory(setMemberRoles(rolesEvent([]), { id: 'tenant-a', userId: 'user-1' }), mocks);
        runStory(removeMember(httpEvent(undefined), { id: 'tenant-a', userId: 'user-1' }), mocks);
        expect(tables[TENANT_MEMBERSHIPS_STORE].filter((row) => row.tenantId === 'tenant-a')).toEqual([
          expect.objectContaining({ userId: 'user-2' }),
        ]);

        // A plain member may leave without any permission, but cannot remove anyone else.
        seedMembership('tenant-c', 'user-2', [TENANT_ADMIN_ROLE]);
        seedMembership('tenant-c', 'user-1', []);
        expect(() => runStory(removeMember(httpEvent(undefined), { id: 'tenant-c', userId: 'user-2' }), mocks)).toThrow(
          /permission to manage members/,
        );
        runStory(removeMember(httpEvent(undefined), { id: 'tenant-c', userId: 'user-1' }), mocks);
        expect(tables[TENANT_MEMBERSHIPS_STORE].filter((row) => row.tenantId === 'tenant-c')).toEqual([
          expect.objectContaining({ userId: 'user-2' }),
        ]);
      });
    });
  });

  describe('getLogo', () => {
    const logoRecord = () => ({
      tenantId: 'tenant-a',
      name: 'acme',
      logo: { guid: 'logo-guid', filename: 'logo.png', mimetype: 'image/png' },
      createdAt: '2026-07-10T00:00:00.000Z',
      updatedAt: '2026-07-10T00:00:00.000Z',
      createdByUserId: 'user-2',
      status: TenantStatus.active,
    });

    const withPresignMock = (mocks: Record<string, unknown>) => {
      const presigns: { drive: string; filepath: string; expirationMs: number; scope?: string }[] = [];
      const presignMocks = {
        ...mocks,
        [FileActionType.GenerateTemporarySecureUrl]: (action: {
          payload: { drive: string; filepath: string; expirationMs: number; scope?: string };
        }) => {
          presigns.push(action.payload);
          return 'https://signed.example/logo';
        },
      };
      return { presignMocks, presigns };
    };

    it("presigns the logo blob in the tenant's own scope, whatever the reader's", () => {
      const { mocks, tables, seedMembership } = buildMocks();
      seedMembership('tenant-a', 'user-1', []);
      tables[TENANT_RECORD_STORE] = [logoRecord()];
      const { presignMocks, presigns } = withPresignMock(mocks);

      // Reader browses their personal partition (no header) - irrelevant to the presign.
      const response = runStory(getLogo(httpEvent(undefined), { id: 'tenant-a' }), presignMocks);

      expect(JSON.parse(response.body!)).toEqual({ url: 'https://signed.example/logo' });
      expect(presigns).toEqual([
        { drive: 'tenantsedocs', filepath: 'tenant-a/assets/logo-guid', expirationMs: 15 * 60 * 1000, scope: 'TENANT#tenant-a' },
      ]);
    });

    it('denies non-members and 404s a missing logo', () => {
      const { mocks, tables, seedMembership } = buildMocks();
      seedMembership('tenant-a', 'user-1', []);
      tables[TENANT_RECORD_STORE] = [{ ...logoRecord(), logo: undefined }];

      expect(() => runStory(getLogo(httpEvent(undefined), { id: 'tenant-b' }), mocks)).toThrow(/not a member/);
      expect(() => runStory(getLogo(httpEvent(undefined), { id: 'tenant-a' }), mocks)).toThrow(/no logo/);
    });
  });
});
