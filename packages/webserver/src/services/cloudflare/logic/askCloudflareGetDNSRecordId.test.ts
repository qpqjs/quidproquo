import { ErrorTypeEnum, NetworkActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askCloudflareGetDNSRecordId } from './askCloudflareGetDNSRecordId';

const singlePage = (records: any[]) => ({
  status: 200,
  data: { result: records, result_info: { total_pages: 1 } },
});

describe('askCloudflareGetDNSRecordId', () => {
  it('returns the id of the first CNAME or A record', () => {
    const result = runStory(askCloudflareGetDNSRecordId('key', 'zone-1', 'www.example.com'), {
      [NetworkActionType.Request]: singlePage([{ id: 'rec-1', type: 'CNAME' }]),
    });

    expect(result).toBe('rec-1');
  });

  it('filters out records that are not CNAME or A', () => {
    const result = runStory(askCloudflareGetDNSRecordId('key', 'zone-1', 'www.example.com'), {
      [NetworkActionType.Request]: singlePage([
        { id: 'txt-1', type: 'TXT' },
        { id: 'a-1', type: 'A' },
      ]),
    });

    expect(result).toBe('a-1');
  });

  it('returns undefined when no matching records exist', () => {
    const result = runStory(askCloudflareGetDNSRecordId('key', 'zone-1', 'www.example.com'), {
      [NetworkActionType.Request]: singlePage([]),
    });

    expect(result).toBeUndefined();
  });

  it('pages through every result page', () => {
    const result = runStory(askCloudflareGetDNSRecordId('key', 'zone-1', 'www.example.com'), {
      [NetworkActionType.Request]: (action: any) => {
        const onFirstPage = action.payload.url.includes('page=1');

        return {
          status: 200,
          data: {
            result: [{ id: onFirstPage ? 'page1-rec' : 'page2-rec', type: 'A' }],
            result_info: { total_pages: 2 },
          },
        };
      },
    });

    expect(result).toBe('page1-rec');
  });

  it('throws a GenericError when the response is not 2xx', () => {
    expect(() =>
      runStory(askCloudflareGetDNSRecordId('key', 'zone-1', 'www.example.com'), {
        [NetworkActionType.Request]: { status: 403, data: { result: [], result_info: { total_pages: 1 } } },
      }),
    ).toThrow(ErrorTypeEnum.GenericError);
  });
});
