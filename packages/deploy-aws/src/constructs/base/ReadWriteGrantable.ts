import { aws_iam } from 'aws-cdk-lib';

/** What the wrapped CDK resource must offer: its own read and write grants. */
export type ReadWriteGrantable = {
  grantRead(grantee: aws_iam.IGrantable): aws_iam.Grant;
  grantWrite(grantee: aws_iam.IGrantable): aws_iam.Grant;
};
