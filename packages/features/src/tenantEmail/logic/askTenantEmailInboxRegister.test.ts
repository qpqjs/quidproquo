import { Action, DateActionType, KeyValueStoreActionType, runStory, throwsError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { toTenantId } from '../../tenant/logic/toTenantId';
import { askTenantEmailInboxRegister } from './askTenantEmailInboxRegister';
import { askTenantEmailInboxRelease } from './askTenantEmailInboxRelease';

const tenant = toTenantId('t-commbank');

describe('askTenantEmailInboxRegister', () => {
  it('claims the normalised local part with a conditional insert', () => {
    let upsert: Action<{ item: unknown; options?: { ifNotExists?: boolean } }> | undefined;

    const inbox = runStory(askTenantEmailInboxRegister(tenant, 'u1', 'Finance.CommBank', 'Finance'), {
      [DateActionType.Now]: '2026-09-21T00:00:00.000Z',
      [KeyValueStoreActionType.Upsert]: (action: Action<{ item: unknown; options?: { ifNotExists?: boolean } }>) => {
        upsert = action;
      },
    });

    expect(inbox.address).toBe('finance.commbank');
    expect(upsert?.payload?.options?.ifNotExists).toBe(true);
    expect(upsert?.payload?.item).toEqual(inbox);
  });

  it('refuses a malformed local part before touching the store', () => {
    expect(() => runStory(askTenantEmailInboxRegister(tenant, 'u1', 'not valid', ''), {})).toThrow(/not a valid email local part/);
  });

  it('surfaces the store conflict when the address is taken', () => {
    expect(() =>
      runStory(askTenantEmailInboxRegister(tenant, 'u1', 'info.anz', ''), {
        [DateActionType.Now]: '2026-09-21T00:00:00.000Z',
        [KeyValueStoreActionType.Upsert]: throwsError('Conflict', 'taken'),
      }),
    ).toThrow(/taken/);
  });
});

describe('askTenantEmailInboxRelease', () => {
  it('deletes an inbox the tenant holds', () => {
    let deleted: string | undefined;

    runStory(askTenantEmailInboxRelease(tenant, 'INFO.anz'), {
      [KeyValueStoreActionType.Get]: { address: 'info.anz', tenantId: tenant, label: '', createdAt: 'now', createdByUserId: 'u1' },
      [KeyValueStoreActionType.Delete]: (action: Action<{ key: string }>) => {
        deleted = action.payload?.key;
      },
    });

    expect(deleted).toBe('info.anz');
  });

  it("treats another tenant's inbox as not found", () => {
    expect(() =>
      runStory(askTenantEmailInboxRelease(tenant, 'info.anz'), {
        [KeyValueStoreActionType.Get]: { address: 'info.anz', tenantId: toTenantId('t-anz'), label: '', createdAt: 'now', createdByUserId: 'u2' },
      }),
    ).toThrow(/No inbox/);
  });
});
