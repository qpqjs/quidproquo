import { KeyValueStoreQPQConfigSetting, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { aws_dynamodb, aws_lambda, aws_lambda_event_sources, aws_ssm, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';
import { kvsStreamArnSsmParameterName } from './QpqCoreKeyValueStoreConstruct';

export interface QpqApiCoreKeyValueStoreStreamConstructProps extends QpqConstructBlockProps {
  keyValueStoreConfig: KeyValueStoreQPQConfigSetting;
  apiLayerVersions?: aws_lambda.ILayerVersion[];
}

// A failing batch is retried, and by DEFAULT a DynamoDB stream keeps retrying the SAME
// batch until it succeeds or the records expire (24 hours), which stalls the whole shard
// behind one poison record. That is the single sharpest edge of using streams, so these
// are set deliberately rather than left to the AWS defaults:
//
// - bisectBatchOnError narrows a failing batch down to the individual bad record instead of
//   condemning everything it travelled with.
// - retryAttempts bounds how long a bad record can hold up the shard.
// - onFailure sends what could not be processed somewhere visible, so a skipped change is
//   an item in a queue rather than silence.
const STREAM_RETRY_ATTEMPTS = 5;

// Records per invocation, and how long to wait accumulating them. The window is what makes
// coalescing worth having: a burst of writes to one item arrives as one batch, and a
// projection collapses it to a single rebuild. It costs projection latency, which is the
// trade an eventually-consistent read model is already making.
const DEFAULT_STREAM_BATCH_SIZE = 100;
const DEFAULT_STREAM_BATCHING_WINDOW_SECONDS = 5;

/**
 * Wires a key-value store's stream to its handler. Created only for stores declaring
 * `onStream`, and only on the owning service's stack — attaching an event source to
 * another service's table would have two services processing the same records.
 */
export class QpqApiCoreKeyValueStoreStreamConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqApiCoreKeyValueStoreStreamConstructProps) {
    super(scope, id, props);

    const streamConfig = props.keyValueStoreConfig.onStream;
    if (!streamConfig) {
      return;
    }

    const isOwnedHere = qpqCoreUtils.getOwnedKeyValueStores(props.qpqConfig).some((kvs) => kvs.uniqueKey === props.keyValueStoreConfig.uniqueKey);

    if (!isOwnedHere) {
      return;
    }

    // fromOtherStack imports by NAME, which carries no stream ARN, and a stream ARN ends
    // in a creation timestamp so it cannot be recomputed. The Inf stack publishes it to a
    // deterministically-named SSM parameter; this resolves at deploy time, so synth stays
    // independent of the other stack.
    const tableName = this.qpqResourceName(props.keyValueStoreConfig.keyValueStoreName, 'kvs');
    const tableStreamArn = aws_ssm.StringParameter.valueForStringParameter(this, kvsStreamArnSsmParameterName(tableName));

    const table = aws_dynamodb.Table.fromTableAttributes(this, 'stream-table', {
      tableName,
      tableStreamArn,
    });

    const func = new Function(this, 'stream', {
      reacreateOnFunctionNameChange: true,
      // Two characters, and that is not a style choice - it is the whole budget.
      //
      // A Lambda name is capped at 64 characters, and this resource carries the longest
      // prefix of anything qpq names: the store name already has `Events` appended before
      // the app-service-environment-feature decoration and the `-qpq` marker are added. The
      // longest at the time this was set was `qpq-admin-sessionsEventLog`, which left exactly
      // two characters for the type. `kvsStream` overran by four; even `str` overruns by one.
      //
      // So this sits at exactly 64 with no headroom: a longer store name, service, feature
      // or actor name will fail synth again, and the fix at that point is a general
      // shortening rule in Function.ts rather than more characters shaved off here.
      functionName: this.qpqResourceName(props.keyValueStoreConfig.keyValueStoreName, 'ks'),

      functionType: 'dynamoStreamEvent_kvsStreamEvent',
      executorName: 'dynamoStreamEvent_kvsStreamEvent',

      qpqConfig: props.qpqConfig,

      apiLayerVersions: props.apiLayerVersions,

      environment: {
        // Never change: keyValueStoreName ~ hard coded to stop logs being recursive,
        // matching the storage drive event lambda's storageDriveName.
        keyValueStoreName: props.keyValueStoreConfig.keyValueStoreName,
        kvsStreamEntry: JSON.stringify(streamConfig.runtime),
        kvsStreamCoalesceByPartitionKey: String(!!streamConfig.coalesceByPartitionKey),
        kvsStreamPartitionKey: props.keyValueStoreConfig.partitionKey.key,
      },

      role: this.getServiceRole(),
    });

    func.lambdaFunction.addEventSource(
      new aws_lambda_event_sources.DynamoEventSource(table, {
        startingPosition: aws_lambda.StartingPosition.TRIM_HORIZON,

        batchSize: streamConfig.batchSize ?? DEFAULT_STREAM_BATCH_SIZE,
        maxBatchingWindow: Duration.seconds(streamConfig.maximumBatchingWindowInSeconds ?? DEFAULT_STREAM_BATCHING_WINDOW_SECONDS),

        // See the note above: without these a single bad record stalls the shard until the
        // records age out, and nothing records that it happened.
        bisectBatchOnError: true,
        retryAttempts: STREAM_RETRY_ATTEMPTS,
        reportBatchItemFailures: true,
      }),
    );
  }
}
