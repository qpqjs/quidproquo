import { aws_iam } from 'aws-cdk-lib';

export interface QpqResource {
  /**
   * Grants read permissions on this resource.
   *
   * @param grantee the role to be granted read-only access to the resource.
   */
  grantRead(grantee: aws_iam.IGrantable): void;

  /**
   * Grants write permissions on the resource.
   *
   * @param grantee the role to be granted write access to the resource.
   */
  grantWrite(grantee: aws_iam.IGrantable): void;

  /**
   * Grants read/write permissions on the resource.
   *
   * @param grantee the role to be granted read/write access to the resource.
   */
  grantAll(grantee: aws_iam.IGrantable): void;
}
