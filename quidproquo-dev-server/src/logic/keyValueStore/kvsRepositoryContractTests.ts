import {
  buildTestQpqConfig,
  defineKeyValueStore,
  KvsLogicalOperatorType,
  KvsQueryOperationType,
  KvsUpdateActionType,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KvsRepository } from './KvsRepository';

export type MakeKvsRepository = (runtimePath: string, settings: QPQConfig) => KvsRepository;

// Shared behavioral contract for every KvsRepository implementation (sqlite, json, ...).
// Run against a fresh implementation with `runKvsRepositoryContractTests(name, makeRepo)`.
export function runKvsRepositoryContractTests(name: string, makeRepo: MakeKvsRepository): void {
  describe(name, () => {
    const openRepos: KvsRepository[] = [];
    let runtimePath: string;

    const make = (settings: QPQConfig): KvsRepository => {
      const repo = makeRepo(runtimePath, buildTestQpqConfig(settings));
      openRepos.push(repo);
      return repo;
    };

    beforeEach(() => {
      runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-kvs-'));
    });

    afterEach(async () => {
      while (openRepos.length) {
        await openRepos.pop()!.close();
      }
      fs.rmSync(runtimePath, { recursive: true, force: true });
    });

    const usersStore = () => make([defineKeyValueStore('users', { key: 'id', type: 'string' })]);
    const ordersStore = () => make([defineKeyValueStore('orders', { key: 'pk', type: 'string' }, [{ key: 'sk', type: 'string' }])]);
    const eventsStore = () => make([defineKeyValueStore('events', { key: 'pk', type: 'string' }, [{ key: 'sk', type: 'number' }])]);

    describe('upsert/get/delete', () => {
      it('upserts an item then reads it back by key', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'Joe' });

        expect(await repo.get('users', 'u1')).toEqual({ id: 'u1', name: 'Joe' });
      });

      it('returns null when getting a missing item', async () => {
        const repo = usersStore();
        expect(await repo.get('users', 'missing')).toBeNull();
      });

      it('upsert overwrites an existing item', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'Joe' });
        await repo.upsert('users', { id: 'u1', name: 'Joey' });

        expect(await repo.get('users', 'u1')).toEqual({ id: 'u1', name: 'Joey' });
      });

      it('reads a composite-key item using the pk#sk key string', async () => {
        const repo = ordersStore();
        await repo.upsert('orders', { pk: 'p1', sk: 's1', total: 5 });

        expect(await repo.get('orders', 'p1#s1')).toEqual({ pk: 'p1', sk: 's1', total: 5 });
      });

      it('delete returns true for an existing item and false for a missing one', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });

        expect(await repo.delete('users', 'u1')).toBe(true);
        expect(await repo.delete('users', 'u1')).toBe(false);
        expect(await repo.get('users', 'u1')).toBeNull();
      });

      it('deletes a composite-key item', async () => {
        const repo = ordersStore();
        await repo.upsert('orders', { pk: 'p1', sk: 's1' });

        expect(await repo.delete('orders', 'p1#s1')).toBe(true);
      });

      it('throws when the store is not in configuration', async () => {
        const repo = usersStore();
        await expect(repo.get('nope', 'x')).rejects.toThrow("Key value store 'nope' not found");
      });

      it('handles concurrent operations racing initialization on a fresh repository', async () => {
        const repo = usersStore();

        const [a, b] = await Promise.all([repo.upsert('users', { id: 'u1', name: 'Joe' }), repo.upsert('users', { id: 'u2', name: 'Sam' })]);

        expect(a).toEqual({ id: 'u1', name: 'Joe' });
        expect(b).toEqual({ id: 'u2', name: 'Sam' });
      });

      it('upsert with ifNotExists succeeds when the key does not yet exist', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'Joe' }, { ifNotExists: true });

        expect(await repo.get('users', 'u1')).toEqual({ id: 'u1', name: 'Joe' });
      });

      it('upsert with ifNotExists throws a ConditionalCheckFailedException when the key already exists', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'Joe' });

        const error = await repo.upsert('users', { id: 'u1', name: 'Other' }, { ifNotExists: true }).catch((e) => e);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('ConditionalCheckFailedException');
        expect(await repo.get('users', 'u1')).toEqual({ id: 'u1', name: 'Joe' });
      });

      it('upserts two composite-key items sharing a pk but differing sk without clobbering each other', async () => {
        const repo = ordersStore();
        await repo.upsert('orders', { pk: 'p1', sk: 's1', total: 5 });
        await repo.upsert('orders', { pk: 'p1', sk: 's2', total: 9 });

        expect(await repo.get('orders', 'p1#s1')).toEqual({ pk: 'p1', sk: 's1', total: 5 });
        expect(await repo.get('orders', 'p1#s2')).toEqual({ pk: 'p1', sk: 's2', total: 9 });
      });

      it('upsert with ifNotExists succeeds on a composite-key store', async () => {
        const repo = ordersStore();
        await repo.upsert('orders', { pk: 'p1', sk: 's1', total: 5 }, { ifNotExists: true });

        expect(await repo.get('orders', 'p1#s1')).toEqual({ pk: 'p1', sk: 's1', total: 5 });
      });

      it('round-trips a numeric-typed partition key', async () => {
        const repo = make([defineKeyValueStore('counters', { key: 'id', type: 'number' })]);
        await repo.upsert('counters', { id: 42, value: 'x' });

        expect(await repo.get('counters', '42')).toEqual({ id: 42, value: 'x' });
      });
    });

    describe('update', () => {
      it('creates a base item from keys when updating a missing row', async () => {
        const repo = usersStore();
        await repo.update('users', 'u1', undefined, [{ attributePath: 'name', action: KvsUpdateActionType.Set, value: 'Joe' }]);

        expect(await repo.get('users', 'u1')).toEqual({ id: 'u1', name: 'Joe' });
      });

      it('applies Set to an existing item', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'Joe' });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'name', action: KvsUpdateActionType.Set, value: 'Joey' }]);

        expect((await repo.get('users', 'u1')).name).toBe('Joey');
      });

      it('Increment seeds from defaultValue then adds when attribute is missing', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'count', action: KvsUpdateActionType.Increment, value: 3, defaultValue: 10 }]);

        expect((await repo.get('users', 'u1')).count).toBe(13);
      });

      it('Increment seeds from defaultValue when attribute is explicitly null', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', count: null });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'count', action: KvsUpdateActionType.Increment, value: 3, defaultValue: 10 }]);

        expect((await repo.get('users', 'u1')).count).toBe(13);
      });

      it('Add increments an existing number', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', count: 1 });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'count', action: KvsUpdateActionType.Add, value: 4 }]);

        expect((await repo.get('users', 'u1')).count).toBe(5);
      });

      it('Add seeds a missing numeric attribute with the given value', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'count', action: KvsUpdateActionType.Add, value: 4 }]);

        expect((await repo.get('users', 'u1')).count).toBe(4);
      });

      it('Add unions array values', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', tags: ['a', 'b'] });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'tags', action: KvsUpdateActionType.Add, value: ['b', 'c'] }]);

        expect((await repo.get('users', 'u1')).tags).toEqual(['a', 'b', 'c']);
      });

      it('Remove deletes an attribute', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', temp: 'x', keep: 'y' });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'temp', action: KvsUpdateActionType.Remove }]);

        expect(await repo.get('users', 'u1')).toEqual({ id: 'u1', keep: 'y' });
      });

      it('Delete removes elements from an array', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', tags: ['a', 'b', 'c'] });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'tags', action: KvsUpdateActionType.Delete, value: ['b'] }]);

        expect((await repo.get('users', 'u1')).tags).toEqual(['a', 'c']);
      });

      it('SetIfNotExists only sets when the attribute is absent', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'Joe' });
        await repo.update('users', 'u1', undefined, [
          { attributePath: 'name', action: KvsUpdateActionType.SetIfNotExists, value: 'Other' },
          { attributePath: 'nick', action: KvsUpdateActionType.SetIfNotExists, value: 'JJ' },
        ]);

        const item = await repo.get('users', 'u1');
        expect(item.name).toBe('Joe');
        expect(item.nick).toBe('JJ');
      });

      it('sets a nested attribute via a dotted path', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });
        await repo.update('users', 'u1', undefined, [{ attributePath: 'profile.city', action: KvsUpdateActionType.Set, value: 'NYC' }]);

        expect((await repo.get('users', 'u1')).profile).toEqual({ city: 'NYC' });
      });

      it('updates an existing composite-key item', async () => {
        const repo = ordersStore();
        await repo.upsert('orders', { pk: 'p1', sk: 's1', total: 1 });
        await repo.update('orders', 'p1', 's1', [{ attributePath: 'total', action: KvsUpdateActionType.Set, value: 9 }]);

        expect((await repo.get('orders', 'p1#s1')).total).toBe(9);
      });

      it('sets a nested attribute via an array-form attribute path', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });
        await repo.update('users', 'u1', undefined, [{ attributePath: ['profile', 'city'], action: KvsUpdateActionType.Set, value: 'NYC' }]);

        expect((await repo.get('users', 'u1')).profile).toEqual({ city: 'NYC' });
      });

      it('creates a base composite-key item from keys when updating a missing row', async () => {
        const repo = ordersStore();
        await repo.update('orders', 'p1', 's1', [{ attributePath: 'total', action: KvsUpdateActionType.Set, value: 3 }]);

        expect(await repo.get('orders', 'p1#s1')).toEqual({ pk: 'p1', sk: 's1', total: 3 });
      });
    });

    describe('query', () => {
      const seedEvents = async (repo: KvsRepository) => {
        await repo.upsert('events', { pk: 'p', sk: 1, kind: 'a' });
        await repo.upsert('events', { pk: 'p', sk: 2, kind: 'b' });
        await repo.upsert('events', { pk: 'p', sk: 10, kind: 'a' });
      };

      it('orders numeric sort keys numerically, not lexically', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query('events', {
          key: 'pk',
          operation: KvsQueryOperationType.Equal,
          valueA: 'p',
        });

        expect(result.items.map((i) => i.sk)).toEqual([1, 2, 10]);
      });

      it('sorts descending when requested', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );

        expect(result.items.map((i) => i.sk)).toEqual([10, 2, 1]);
      });

      it('filters with a logical AND across a key range and a data field', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query(
          'events',
          {
            operation: KvsLogicalOperatorType.And,
            conditions: [
              { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
              { key: 'sk', operation: KvsQueryOperationType.GreaterThan, valueA: 1 },
            ],
          },
          { key: 'kind', operation: KvsQueryOperationType.Equal, valueA: 'a' },
        );

        expect(result.items.map((i) => i.sk)).toEqual([10]);
      });

      it('supports LessThan, LessThanOrEqual and GreaterThanOrEqual on a numeric sort key', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const lessThan = await repo.query('events', {
          operation: KvsLogicalOperatorType.And,
          conditions: [
            { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
            { key: 'sk', operation: KvsQueryOperationType.LessThan, valueA: 2 },
          ],
        });
        expect(lessThan.items.map((i) => i.sk)).toEqual([1]);

        const lessThanOrEqual = await repo.query('events', {
          operation: KvsLogicalOperatorType.And,
          conditions: [
            { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
            { key: 'sk', operation: KvsQueryOperationType.LessThanOrEqual, valueA: 2 },
          ],
        });
        expect(lessThanOrEqual.items.map((i) => i.sk)).toEqual([1, 2]);

        const greaterThanOrEqual = await repo.query('events', {
          operation: KvsLogicalOperatorType.And,
          conditions: [
            { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
            { key: 'sk', operation: KvsQueryOperationType.GreaterThanOrEqual, valueA: 2 },
          ],
        });
        expect(greaterThanOrEqual.items.map((i) => i.sk)).toEqual([2, 10]);
      });

      it('supports Between on a numeric sort key', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query('events', {
          operation: KvsLogicalOperatorType.And,
          conditions: [
            { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
            { key: 'sk', operation: KvsQueryOperationType.Between, valueA: 2, valueB: 10 },
          ],
        });

        expect(result.items.map((i) => i.sk)).toEqual([2, 10]);
      });

      it('supports In on a numeric sort key', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query('events', {
          operation: KvsLogicalOperatorType.And,
          conditions: [
            { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
            { key: 'sk', operation: KvsQueryOperationType.In, valueA: [1, 10] },
          ],
        });

        expect(result.items.map((i) => i.sk)).toEqual([1, 10]);
      });

      it('supports BeginsWith on a string sort key', async () => {
        const repo = ordersStore();
        await repo.upsert('orders', { pk: 'p', sk: '2024-01' });
        await repo.upsert('orders', { pk: 'p', sk: '2025-01' });

        const result = await repo.query('orders', {
          operation: KvsLogicalOperatorType.And,
          conditions: [
            { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
            { key: 'sk', operation: KvsQueryOperationType.BeginsWith, valueA: '2024' },
          ],
        });

        expect(result.items.map((i) => i.sk)).toEqual(['2024-01']);
      });

      it('supports an OR of data-field conditions', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          {
            operation: KvsLogicalOperatorType.Or,
            conditions: [
              { key: 'kind', operation: KvsQueryOperationType.Equal, valueA: 'b' },
              { key: 'sk', operation: KvsQueryOperationType.Equal, valueA: 10 },
            ],
          },
        );

        expect(result.items.map((i) => i.sk)).toEqual([2, 10]);
      });

      it('paginates results across pages using nextPageKey', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const keyCondition = { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' };
        const collected: number[] = [];
        let nextPageKey: string | undefined;

        do {
          const page = await repo.query('events', keyCondition, undefined, nextPageKey, undefined, 1);
          collected.push(...page.items.map((i) => i.sk));
          nextPageKey = page.nextPageKey;
        } while (nextPageKey);

        expect(collected).toEqual([1, 2, 10]);
      });

      it('throws on an unsupported query operation', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        await expect(repo.query('events', { key: 'pk', operation: 'Nope' as KvsQueryOperationType, valueA: 'p' })).rejects.toThrow(
          'Unsupported query operation',
        );
      });

      it('supports Contains and NotContains on a data field', async () => {
        const repo = eventsStore();
        await repo.upsert('events', { pk: 'p', sk: 1, label: 'hello world' });
        await repo.upsert('events', { pk: 'p', sk: 2, label: 'goodbye' });

        const contains = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          { key: 'label', operation: KvsQueryOperationType.Contains, valueA: 'hello' },
        );
        expect(contains.items.map((i) => i.sk)).toEqual([1]);

        const notContains = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          { key: 'label', operation: KvsQueryOperationType.NotContains, valueA: 'hello' },
        );
        expect(notContains.items.map((i) => i.sk)).toEqual([2]);
      });

      it('supports Exists and NotExists on a data field', async () => {
        const repo = eventsStore();
        await repo.upsert('events', { pk: 'p', sk: 1, optional: 'x' });
        await repo.upsert('events', { pk: 'p', sk: 2 });

        const exists = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          { key: 'optional', operation: KvsQueryOperationType.Exists, valueA: undefined },
        );
        expect(exists.items.map((i) => i.sk)).toEqual([1]);

        const notExists = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          { key: 'optional', operation: KvsQueryOperationType.NotExists, valueA: undefined },
        );
        expect(notExists.items.map((i) => i.sk)).toEqual([2]);
      });

      it('supports NotEqual on a data field', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          { key: 'kind', operation: KvsQueryOperationType.NotEqual, valueA: 'a' },
        );

        expect(result.items.map((i) => i.sk)).toEqual([2]);
      });

      it('filters on a nested dotted attribute path', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', address: { city: 'NYC' } });
        await repo.upsert('users', { id: 'u2', address: { city: 'LA' } });

        const result = await repo.scan('users', { key: 'address.city', operation: KvsQueryOperationType.Equal, valueA: 'NYC' });

        expect(result.items.map((i) => i.id)).toEqual(['u1']);
      });

      it('applies a filter that eliminates rows mid-page without truncating the page early', async () => {
        const repo = eventsStore();
        await repo.upsert('events', { pk: 'p', sk: 1, kind: 'a' });
        await repo.upsert('events', { pk: 'p', sk: 2, kind: 'b' });
        await repo.upsert('events', { pk: 'p', sk: 3, kind: 'a' });
        await repo.upsert('events', { pk: 'p', sk: 4, kind: 'b' });

        const result = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          { key: 'kind', operation: KvsQueryOperationType.Equal, valueA: 'a' },
          undefined,
          undefined,
          10,
        );

        expect(result.items.map((i) => i.sk)).toEqual([1, 3]);
        expect(result.nextPageKey).toBeUndefined();
      });

      it('returns an empty result set with no nextPageKey when nothing matches', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query('events', { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'missing' });

        expect(result).toEqual({ items: [], nextPageKey: undefined });
      });

      it('omits nextPageKey when the result count exactly matches the limit', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const result = await repo.query(
          'events',
          { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' },
          undefined,
          undefined,
          undefined,
          3,
        );

        expect(result.items.map((i) => i.sk)).toEqual([1, 2, 10]);
        expect(result.nextPageKey).toBeUndefined();
      });

      it('returns the remainder and no cursor on the final page', async () => {
        const repo = eventsStore();
        await seedEvents(repo);
        const keyCondition = { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' };

        const page1 = await repo.query('events', keyCondition, undefined, undefined, undefined, 2);
        expect(page1.items.map((i) => i.sk)).toEqual([1, 2]);
        expect(page1.nextPageKey).toBeDefined();

        const page2 = await repo.query('events', keyCondition, undefined, page1.nextPageKey, undefined, 2);
        expect(page2.items.map((i) => i.sk)).toEqual([10]);
        expect(page2.nextPageKey).toBeUndefined();
      });

      it('paginates a descending query across pages', async () => {
        const repo = eventsStore();
        await seedEvents(repo);

        const keyCondition = { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' };
        const collected: number[] = [];
        let nextPageKey: string | undefined;

        do {
          const page = await repo.query('events', keyCondition, undefined, nextPageKey, undefined, 1, false);
          collected.push(...page.items.map((i) => i.sk));
          nextPageKey = page.nextPageKey;
        } while (nextPageKey);

        expect(collected).toEqual([10, 2, 1]);
      });

      it('defaults to a page size of 100 when no limit is passed', async () => {
        const repo = eventsStore();
        for (let i = 0; i < 105; i++) {
          await repo.upsert('events', { pk: 'p', sk: i, kind: 'a' });
        }

        const result = await repo.query('events', { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'p' });

        expect(result.items).toHaveLength(100);
        expect(result.nextPageKey).toBeDefined();
      });
    });

    describe('scan', () => {
      it('scans all items in a store', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });
        await repo.upsert('users', { id: 'u2' });

        const result = await repo.scan('users');

        expect(result.items.map((i) => i.id).sort()).toEqual(['u1', 'u2']);
      });

      it('scans with a filter on a data field', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', active: true });
        await repo.upsert('users', { id: 'u2', active: false });

        const result = await repo.scan('users', {
          key: 'active',
          operation: KvsQueryOperationType.Equal,
          valueA: true,
        });

        expect(result.items.map((i) => i.id)).toEqual(['u1']);
      });

      it('paginates a scan across pages', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });
        await repo.upsert('users', { id: 'u2' });
        await repo.upsert('users', { id: 'u3' });

        const collected: string[] = [];
        let nextPageKey: string | undefined;
        do {
          const page = await repo.scan('users', undefined, nextPageKey, 1);
          collected.push(...page.items.map((i) => i.id));
          nextPageKey = page.nextPageKey;
        } while (nextPageKey);

        expect(collected.sort()).toEqual(['u1', 'u2', 'u3']);
      });

      it('paginates a scan with a filter applied', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', active: true });
        await repo.upsert('users', { id: 'u2', active: false });
        await repo.upsert('users', { id: 'u3', active: true });
        await repo.upsert('users', { id: 'u4', active: true });

        const collected: string[] = [];
        let nextPageKey: string | undefined;
        do {
          const page = await repo.scan('users', { key: 'active', operation: KvsQueryOperationType.Equal, valueA: true }, nextPageKey, 1);
          collected.push(...page.items.map((i) => i.id));
          nextPageKey = page.nextPageKey;
        } while (nextPageKey);

        expect(collected.sort()).toEqual(['u1', 'u3', 'u4']);
      });
    });

    describe('indexes', () => {
      const indexedStore = () =>
        make([
          defineKeyValueStore('people', { key: 'id', type: 'string' }, [], {
            indexes: [{ partitionKey: { key: 'email', type: 'string' }, sortKey: { key: 'age', type: 'number' } }],
          }),
        ]);

      it('maintains the index table across upsert, update and delete', async () => {
        const repo = indexedStore();
        await repo.upsert('people', { id: 'u1', email: 'a@x.com', age: 30 });
        await repo.update('people', 'u1', undefined, [{ attributePath: 'email', action: KvsUpdateActionType.Set, value: 'b@x.com' }]);
        expect((await repo.get('people', 'u1')).email).toBe('b@x.com');

        expect(await repo.delete('people', 'u1')).toBe(true);
        expect(await repo.get('people', 'u1')).toBeNull();
      });

      it('upserts an item missing the indexed attribute without throwing', async () => {
        const repo = indexedStore();
        await repo.upsert('people', { id: 'u1' });

        expect(await repo.get('people', 'u1')).toEqual({ id: 'u1' });
      });

      it('maintains an index without a sort key', async () => {
        const repo = make([
          defineKeyValueStore('accounts', { key: 'id', type: 'string' }, [], {
            indexes: [{ partitionKey: { key: 'email', type: 'string' } }],
          }),
        ]);

        await repo.upsert('accounts', { id: 'a1', email: 'a@x.com' });
        await repo.delete('accounts', 'a1');

        expect(await repo.get('accounts', 'a1')).toBeNull();
      });
    });

    describe('multi-store', () => {
      it('keeps items in separate stores from leaking into each other', async () => {
        const repo = make([defineKeyValueStore('cats', { key: 'id', type: 'string' }), defineKeyValueStore('dogs', { key: 'id', type: 'string' })]);

        await repo.upsert('cats', { id: 'shared', kind: 'cat' });
        await repo.upsert('dogs', { id: 'shared', kind: 'dog' });

        expect(await repo.get('cats', 'shared')).toEqual({ id: 'shared', kind: 'cat' });
        expect(await repo.get('dogs', 'shared')).toEqual({ id: 'shared', kind: 'dog' });

        const catScan = await repo.scan('cats');
        expect(catScan.items).toEqual([{ id: 'shared', kind: 'cat' }]);

        const dogScan = await repo.scan('dogs');
        expect(dogScan.items).toEqual([{ id: 'shared', kind: 'dog' }]);
      });

      it('supports store names containing hyphens', async () => {
        const repo = make([defineKeyValueStore('user-sessions', { key: 'id', type: 'string' })]);
        await repo.upsert('user-sessions', { id: 's1', active: true });

        expect(await repo.get('user-sessions', 's1')).toEqual({ id: 's1', active: true });
      });
    });

    describe('scope', () => {
      it('isolates a scoped item from other scopes and from unscoped access', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'A' }, undefined, 'tenant-a');

        expect(await repo.get('users', 'u1', 'tenant-a')).toEqual({ id: 'u1', name: 'A' });
        expect(await repo.get('users', 'u1', 'tenant-b')).toBeNull();
        expect(await repo.get('users', 'u1')).toBeNull();
      });

      it('keeps unscoped items invisible to scoped reads', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'Global' });

        expect(await repo.get('users', 'u1', 'tenant-a')).toBeNull();
      });

      it('holds independent items for the same key under two scopes', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'A' }, undefined, 'tenant-a');
        await repo.upsert('users', { id: 'u1', name: 'B' }, undefined, 'tenant-b');

        expect(await repo.get('users', 'u1', 'tenant-a')).toEqual({ id: 'u1', name: 'A' });
        expect(await repo.get('users', 'u1', 'tenant-b')).toEqual({ id: 'u1', name: 'B' });
      });

      it('restricts query, scan and getAll to the scope', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'A' }, undefined, 'tenant-a');
        await repo.upsert('users', { id: 'u2', name: 'B' }, undefined, 'tenant-b');
        await repo.upsert('users', { id: 'u3', name: 'C' });

        const queried = await repo.query(
          'users',
          { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'u1' },
          undefined,
          undefined,
          undefined,
          undefined,
          true,
          'tenant-a',
        );
        expect(queried.items).toEqual([{ id: 'u1', name: 'A' }]);

        const scanned = await repo.scan('users', undefined, undefined, undefined, 'tenant-a');
        expect(scanned.items).toEqual([{ id: 'u1', name: 'A' }]);

        expect(await repo.getAll('users', 'tenant-a')).toEqual([{ id: 'u1', name: 'A' }]);
        expect(await repo.getAll('users')).toEqual([{ id: 'u3', name: 'C' }]);
      });

      it('deletes only within the scope', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'A' }, undefined, 'tenant-a');
        await repo.upsert('users', { id: 'u1', name: 'B' }, undefined, 'tenant-b');

        expect(await repo.delete('users', 'u1', 'tenant-a')).toBe(true);

        expect(await repo.get('users', 'u1', 'tenant-a')).toBeNull();
        expect(await repo.get('users', 'u1', 'tenant-b')).toEqual({ id: 'u1', name: 'B' });
      });

      it('scopes upsertMany and reports replaced rows per scope', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1', name: 'old' }, undefined, 'tenant-a');

        const results = await repo.upsertMany(
          'users',
          [
            { id: 'u1', name: 'new' },
            { id: 'u2', name: 'B' },
          ],
          'tenant-a',
        );

        expect(results).toEqual([
          { item: { id: 'u1', name: 'new' }, oldItem: { id: 'u1', name: 'old' } },
          { item: { id: 'u2', name: 'B' }, oldItem: null },
        ]);
        expect(await repo.get('users', 'u1')).toBeNull();
        expect(await repo.get('users', 'u2', 'tenant-a')).toEqual({ id: 'u2', name: 'B' });
      });
    });

    describe('listScopes', () => {
      it('lists only the scopes holding data for the store, excluding unscoped', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });
        await repo.upsert('users', { id: 'u2' }, undefined, 'tenant-a');
        await repo.upsert('users', { id: 'u3' }, undefined, 'tenant-b');

        expect((await repo.listScopes('users')).sort()).toEqual(['tenant-a', 'tenant-b']);
      });

      it('returns an empty list for a store with no scoped data', async () => {
        const repo = usersStore();
        await repo.upsert('users', { id: 'u1' });

        expect(await repo.listScopes('users')).toEqual([]);
      });

      it('lists scopes for a store owned by another module', async () => {
        // Regression: the json engine listed scopes under the application
        // module's directory while reads and writes used the owner module's,
        // so scan-all-scopes over a shared store silently saw only unscoped
        // data. In the contract so no engine reintroduces the split.
        const repo = make([defineKeyValueStore('widgets', { key: 'id', type: 'string' }, [], { owner: { module: 'other-service' } })]);
        await repo.upsert('widgets', { id: 'w1' }, undefined, 'tenant-a');

        expect(await repo.listScopes('widgets')).toEqual(['tenant-a']);
      });
    });

    describe('cross-instance visibility', () => {
      // One repository per service over one shared runtime path means a store
      // owned by A and read by B crosses instances on every request, so
      // committed writes must be visible across instances immediately.
      it('sees another instance write through a second repository over the same runtime path', async () => {
        const settings = [defineKeyValueStore('users', { key: 'id', type: 'string' })];
        const writer = make(settings);
        const reader = make(settings);

        await writer.upsert('users', { id: 'u1', version: 1 });
        expect(await reader.get('users', 'u1')).toEqual({ id: 'u1', version: 1 });

        // The original staleness bug: the reader has already touched the
        // store; a later write through the other instance must still come
        // back, not a cached first-read snapshot.
        await writer.upsert('users', { id: 'u1', version: 2 });
        expect(await reader.get('users', 'u1')).toEqual({ id: 'u1', version: 2 });
      });
    });

    describe('durability', () => {
      it('makes a resolved write visible to a freshly constructed repository, with no close and no flush', async () => {
        const settings = [defineKeyValueStore('users', { key: 'id', type: 'string' })];
        await make(settings).upsert('users', { id: 'u1', name: 'A' });

        expect(await make(settings).get('users', 'u1')).toEqual({ id: 'u1', name: 'A' });
      });
    });
  });
}
