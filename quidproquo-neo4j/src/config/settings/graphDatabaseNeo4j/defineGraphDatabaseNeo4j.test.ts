import { QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineGraphDatabaseNeo4j } from './defineGraphDatabaseNeo4j';

describe('defineGraphDatabaseNeo4j', () => {
  it('defines a parameter, secret, action processors and a keep-alive schedule', () => {
    const settings = defineGraphDatabaseNeo4j('myDb');

    expect(settings.map((setting: any) => setting.configSettingType)).toEqual([
      QPQCoreConfigSettingType.parameter,
      QPQCoreConfigSettingType.secret,
      QPQCoreConfigSettingType.actionProcessors,
      QPQCoreConfigSettingType.schedule,
    ]);
  });

  it('names the parameter and secret after the database', () => {
    const settings = defineGraphDatabaseNeo4j('myDb');

    expect((settings[0] as any).uniqueKey).toBe('neo4j-myDb-instance');
    expect((settings[1] as any).uniqueKey).toBe('neo4j-myDb-password');
  });

  it('schedules the keep-alive once a day carrying the database name as metadata', () => {
    const settings = defineGraphDatabaseNeo4j('myDb');
    const schedule = settings[3] as any;

    expect(schedule.recurrence).toEqual({ dailyAtUtc: { hour: 0, minute: 0 } });
    expect(schedule.metadata).toEqual({ databaseName: 'myDb' });
  });
});
