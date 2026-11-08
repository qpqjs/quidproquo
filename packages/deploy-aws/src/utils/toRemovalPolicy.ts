import { AwsDataStoreRemovalPolicy } from '@qpqjs/config-aws';

import * as cdk from 'aws-cdk-lib';

/**
 * The CDK removal policy a data store takes from the deployment's defineAwsDataStoreRemovalPolicy: DESTROY when the
 * config opts into full teardown, otherwise `whenRetained` (RETAIN by default; a store that can take a final snapshot
 * passes SNAPSHOT so nothing is left running).
 */
export const toRemovalPolicy = (
  dataStoreRemovalPolicy: AwsDataStoreRemovalPolicy,
  whenRetained: cdk.RemovalPolicy = cdk.RemovalPolicy.RETAIN,
): cdk.RemovalPolicy => (dataStoreRemovalPolicy === AwsDataStoreRemovalPolicy.destroy ? cdk.RemovalPolicy.DESTROY : whenRetained);
