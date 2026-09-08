import { Nullable } from 'quidproquo-core';

import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

/** A stack's status, or null when it does not exist. */
export const describeStackStatus = async (stackName: string, region: string): Promise<Nullable<string>> => {
  try {
    const { Stacks } = await new CloudFormationClient({ region }).send(new DescribeStacksCommand({ StackName: stackName }));
    return Stacks?.[0]?.StackStatus ?? null;
  } catch (error) {
    if (error instanceof Error && /does not exist/.test(error.message)) {
      return null;
    }
    throw error;
  }
};

const healthyStatuses = ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'IMPORT_COMPLETE'];

export const isStackHealthy = (status: Nullable<string>): boolean => status !== null && healthyStatuses.includes(status);
