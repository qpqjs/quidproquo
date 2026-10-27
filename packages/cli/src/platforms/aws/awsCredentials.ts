import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

export const isAwsCredentialsValid = async (): Promise<boolean> => {
  try {
    const client = new STSClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
    });
    await client.send(new GetCallerIdentityCommand({}));
    return true;
  } catch (error) {
    console.log('Error validating AWS credentials:', error);
    return false;
  }
};
