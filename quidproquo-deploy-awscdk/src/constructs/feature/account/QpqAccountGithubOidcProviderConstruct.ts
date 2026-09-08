import { aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../base/QpqConstructBlock';

export interface QpqAccountGithubOidcProviderConstructProps extends QpqConstructBlockProps {}

// The URL fixes the provider's ARN (arn:aws:iam::<account>:oidc-provider/token.actions.
// githubusercontent.com), which is what the per-app deploy roles trust by name.
export class QpqAccountGithubOidcProviderConstruct extends QpqConstructBlock {
  public readonly provider: aws_iam.OpenIdConnectProvider;

  constructor(scope: Construct, id: string, props: QpqAccountGithubOidcProviderConstructProps) {
    super(scope, id, props);

    this.provider = new aws_iam.OpenIdConnectProvider(this, 'provider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });
  }
}
