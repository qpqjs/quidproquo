import { aws_iam } from 'aws-cdk-lib';

import { QpqConstructBlock } from './QpqConstructBlock';
import { ReadWriteGrantable } from './ReadWriteGrantable';

/**
 * A block wrapping one CDK resource that grants itself (a secret, an SSM parameter): the
 * block's grants delegate to it. The fromOtherStack imports extend this too, so an imported
 * and a created resource grant identically.
 */
export abstract class QpqReadWriteResourceConstructBase<T extends ReadWriteGrantable> extends QpqConstructBlock {
  abstract resource: T;

  public override grantRead(grantee: aws_iam.IGrantable): void {
    this.resource.grantRead(grantee);
  }

  public override grantWrite(grantee: aws_iam.IGrantable): void {
    this.resource.grantWrite(grantee);
  }
}
