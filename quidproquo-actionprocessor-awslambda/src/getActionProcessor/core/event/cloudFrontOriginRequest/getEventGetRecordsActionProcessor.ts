import {
  actionResult,
  askEventGetRecordsBase,
  createActionProcessor,
  DynamicModuleLoader,
  EventActionType,
  HTTPMethod,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { EventInput, InternalEventRecord } from './types';

const getProcessGetRecords = async (qpqConfig: QPQConfig, loader: DynamicModuleLoader): Promise<ProcessorFor<typeof askEventGetRecordsBase>> => {
  const domainResolver = await qpqWebServerUtils.loadDomainResolver(qpqConfig, loader);

  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [cloudFrontRequestEvent, context] = eventParams as EventInput;

    const records = cloudFrontRequestEvent.Records.map((record) => {
      const cfRecordRequest = record.cf.request;

      const headers: Record<string, string> = Object.keys(cfRecordRequest.headers).reduce(
        (acc, header) => ({
          ...acc,
          [header]: cfRecordRequest.headers[header][0].value,
        }),
        {},
      );

      const internalRecord: InternalEventRecord = {
        // Without a declared domain there is nothing to validate the Host header against,
        // so it is the only value left; with one, a matched root wins over the header.
        domain: qpqWebServerUtils.resolveHostForRequestHost(qpqConfig, headers.host, {}, domainResolver) ?? headers.host ?? '',
        body: cfRecordRequest.body,
        correlation: context.awsRequestId,
        method: cfRecordRequest.method as HTTPMethod,
        path: cfRecordRequest.uri,
        sourceIp: cfRecordRequest.clientIp,
        headers: headers,
        // Only reaches the origin-request function when the behaviour forwards it
        // (see WebQpqWebserverWebEntryConstruct). `querystring` is '' when there is none.
        query: qpqWebServerUtils.parseQueryString(cfRecordRequest.querystring),
      };

      return internalRecord;
    });

    return actionResult(records);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
