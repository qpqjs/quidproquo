import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { EmailReceivingDomainQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { aws_route53, aws_ses } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { domainScopedId, lookupHostedZone, resolveHostedZoneForHost } from '../../../../utils/domain';
import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { resolveEmailReceivingHosts } from './resolveEmailReceivingHosts';

export interface QpqBootstrapEmailReceivingDomainConstructProps extends QpqConstructBlockProps {
  emailReceivingDomainConfig: EmailReceivingDomainQPQWebServerConfigSetting;
}

// Per root: the receiving host as a verified SES identity (DKIM CNAMEs in its zone) and the
// MX record that routes its mail to SES in the deploy region. The identity is the host
// itself rather than the zone, so it stands apart from a service's sending identity on the
// site root.
export class QpqBootstrapEmailReceivingDomainConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqBootstrapEmailReceivingDomainConstructProps) {
    super(scope, id, props);

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);

    for (const { rootDomain, host } of resolveEmailReceivingHosts(props.qpqConfig)) {
      const hostedZone = lookupHostedZone(this, resolveHostedZoneForHost(props.qpqConfig, host));

      const identity = new aws_ses.EmailIdentity(this, domainScopedId(props.qpqConfig, 'identity', rootDomain), {
        identity: aws_ses.Identity.domain(host),
      });

      // The DKIM names are deploy-time tokens, so CDK cannot see they are already fully
      // qualified and would append the zone again; the trailing dot tells it not to.
      identity.dkimRecords.forEach((record, index) => {
        new aws_route53.CnameRecord(this, domainScopedId(props.qpqConfig, `dkim-${index}`, rootDomain), {
          zone: hostedZone,
          recordName: `${record.name}.`,
          domainName: record.value,
        });
      });

      new aws_route53.MxRecord(this, domainScopedId(props.qpqConfig, 'mx', rootDomain), {
        zone: hostedZone,
        recordName: host,
        values: [{ priority: 10, hostName: `inbound-smtp.${region}.amazonaws.com` }],
      });
    }
  }
}
