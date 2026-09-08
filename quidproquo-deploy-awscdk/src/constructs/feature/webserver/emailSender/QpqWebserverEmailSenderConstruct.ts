import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig } from 'quidproquo-core';
import { EmailSenderQPQWebServerConfigSetting, qpqWebServerUtils } from 'quidproquo-webserver';

import { aws_iam, aws_route53, aws_ses } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { domainScopedId, lookupHostedZone, resolveDeployHostForRoot, resolveHostedZoneForHost } from '../../../../utils/domain';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqWebserverEmailSenderConstructProps extends QpqConstructBlockProps {
  emailSenderConfig: EmailSenderQPQWebServerConfigSetting;
}

// The sending identity per root is its site root (development.example.com), which is
// also the zone the DKIM records land in.
const getIdentityDomains = (qpqConfig: QPQConfig): { rootDomain: string; identityDomain: string }[] =>
  qpqWebServerUtils.getRootDomains(qpqConfig).map((rootDomain) => ({
    rootDomain,
    identityDomain: resolveDeployHostForRoot(qpqConfig, rootDomain, {}),
  }));

export class QpqWebserverEmailSenderConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqWebserverEmailSenderConstructProps) {
    super(scope, id, props);

    for (const { rootDomain, identityDomain } of getIdentityDomains(props.qpqConfig)) {
      const hostedZone = lookupHostedZone(this, resolveHostedZoneForHost(props.qpqConfig, identityDomain));

      // qpq zones are always public (they serve public DNS); fromLookup just types
      // them as the broader IHostedZone
      new aws_ses.EmailIdentity(this, domainScopedId(props.qpqConfig, 'identity', rootDomain), {
        identity: aws_ses.Identity.publicHostedZone(hostedZone as aws_route53.IPublicHostedZone),
      });
    }
  }

  // Scope email sending to this service's own verified identity domains (exact ARNs, per the
  // shared-account rule). SendRawEmail is needed for the attachment (raw MIME) path.
  // While the SES account is in sandbox, SES also authorizes against the recipient's identity,
  // so any defineEmailSenderAllowList addresses are granted too.
  // No-op when the service declares no email sender.
  public static authorizeSendEmailForRole(
    role: aws_iam.IRole,
    emailSenderConfigs: EmailSenderQPQWebServerConfigSetting[],
    qpqConfig: QPQConfig,
  ): void {
    if (emailSenderConfigs.length > 0) {
      const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
      const accountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(qpqConfig);

      const identityArn = (identity: string): string => `arn:aws:ses:${region}:${accountId}:identity/${identity}`;

      const resources = [
        ...getIdentityDomains(qpqConfig).map(({ identityDomain }) => identityArn(identityDomain)),
        ...qpqConfigAwsUtils.getEmailSenderAllowedAddresses(qpqConfig).map(identityArn),
      ];

      role.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          sid: 'SESSendEmail',
          effect: aws_iam.Effect.ALLOW,
          actions: ['ses:SendEmail', 'ses:SendRawEmail'],
          resources: [...new Set(resources)],
        }),
      );
    }
  }
}
