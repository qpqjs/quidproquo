import {
  Action,
  ConfigActionType,
  ErrorTypeEnum,
  FileActionType,
  KeyValueStoreActionType,
  QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME,
  runStory,
  StoryError,
} from 'quidproquo-core';
import { HTTPEvent, ServiceFunctionActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { downloadUrl, getChildren, getLog, getServiceNames, traceLog } from './logController';

const event = {} as HTTPEvent;

describe('getLog', () => {
  it('returns the correlation log as a json response', () => {
    const log = { correlation: 'c1' };

    const response = runStory(getLog(event, { correlationId: 'c1' }), {
      [KeyValueStoreActionType.Query]: { items: [log] },
    });

    expect(response.status).toBe(200);
    expect(JSON.parse(response.body!)).toEqual(log);
  });

  it('throws a NotFound error when the log is missing', () => {
    const run = () =>
      runStory(getLog(event, { correlationId: 'missing' }), {
        [KeyValueStoreActionType.Query]: { items: [] },
      });

    expect(run).toThrow(StoryError);
    try {
      run();
    } catch (e) {
      expect((e as StoryError).errorType).toBe(ErrorTypeEnum.NotFound);
    }
  });
});

describe('getServiceNames', () => {
  it('returns the configured service names and the log service name', () => {
    const services = ['auth', 'log'];

    const response = runStory(getServiceNames(event), {
      [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
        action.payload.globalName === 'qpq-serviceNames' ? services : 'log',
    });

    expect(JSON.parse(response.body!)).toEqual({ services, logServiceName: 'log' });
  });
});

describe('getChildren', () => {
  it('returns the logs sharing the from-correlation', () => {
    const children = { items: [{ correlation: 'c2' }] };

    const response = runStory(getChildren(event, { fromCorrelation: 'c1' }), {
      [KeyValueStoreActionType.Query]: children,
    });

    expect(JSON.parse(response.body!)).toEqual(children);
  });
});

describe('downloadUrl', () => {
  it('signs the cached redacted copy on the reports drive', () => {
    let signed: Action<any> | undefined;

    const response = runStory(downloadUrl(event, { correlationId: 'c1' }), {
      [FileActionType.Exists]: true,
      [FileActionType.GenerateTemporarySecureUrl]: (action: Action<any>) => {
        signed = action;
        return 'https://signed.example/c1.redacted.json';
      },
    });

    expect(signed?.payload).toMatchObject({ drive: QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, filepath: 'c1.redacted.json' });
    expect(JSON.parse(response.body!)).toEqual({ url: 'https://signed.example/c1.redacted.json', isColdStorage: false });
  });

  it('reports cold storage without a url when no redacted copy is cached', () => {
    const response = runStory(downloadUrl(event, { correlationId: 'c1' }), {
      [FileActionType.Exists]: false,
      [FileActionType.IsColdStorage]: true,
    });

    expect(JSON.parse(response.body!)).toEqual({ url: '', isColdStorage: true });
  });
});

describe('traceLog', () => {
  it('ships the redacted log to the owning service when no trace exists', () => {
    const redactedLog = { correlation: 'c1', moduleName: 'svc', history: [] };
    let executed: Action<any> | undefined;

    const response = runStory(traceLog({ query: {} } as unknown as HTTPEvent, { correlationId: 'c1' }), {
      [FileActionType.Exists]: (action: Action<any>) => action.payload.filepath !== 'c1.trace.json',
      [FileActionType.ReadObjectJson]: (action: Action<any>) => {
        expect(action.payload).toMatchObject({ drive: QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, filepath: 'c1.redacted.json' });
        return redactedLog;
      },
      [ConfigActionType.GetApplicationInfo]: { module: 'log-service' },
      [ServiceFunctionActionType.Execute]: (action: Action<any>) => {
        executed = action;
      },
    });

    expect(executed?.payload.payload.storyResult).toBe(redactedLog);
    expect(JSON.parse(response.body!)).toEqual({ pending: true });
  });
});
