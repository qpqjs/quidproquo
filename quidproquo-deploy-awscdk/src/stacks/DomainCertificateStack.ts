import { DomainCertificateQPQConfigSetting, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { aws_certificatemanager, aws_iam, aws_ssm, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

import { requireDomainResolver } from '../appWorkspace/requireDomainResolver';
import { lookupHostedZone, resolveHostedZoneForHost } from '../utils/domain';
import { applyApplicationTags } from '../utils/qpqDeployAwsCdkUtils';

export interface DomainCertificateStackProps {
  qpqConfig: QPQConfig;
  certificateConfig: DomainCertificateQPQConfigSetting;

  stackName?: string;
}

// ACM's default quota for names on one certificate; a synth error beats a deploy failure.
const acmDomainNamesPerCertificateQuota = 10;

const buildDomainNames = (qpqConfig: QPQConfig, certificateConfig: DomainCertificateQPQConfigSetting): string[] => {
  const resolver = requireDomainResolver(qpqConfig);
  const targets = [...(certificateConfig.includeApex ? [{}] : []), ...certificateConfig.targets];
  const domainNames = [...new Set(targets.flatMap((target) => qpqWebServerUtils.resolveHosts(qpqConfig, target, resolver)))];

  if (domainNames.length === 0) {
    throw new Error(`defineDomainCertificate("${certificateConfig.region}", ...) must declare at least one target, or set includeApex: true`);
  }

  if (domainNames.length > acmDomainNamesPerCertificateQuota) {
    throw new Error(
      `The ${certificateConfig.region} certificate needs ${domainNames.length} names (${domainNames.join(', ')}) but ACM allows ` +
        `${acmDomainNamesPerCertificateQuota} per certificate by default; request a quota increase or declare fewer targets/roots`,
    );
  }

  return domainNames;
};

/**
 * One certificate per region covering every root, DNS-validated in each name's own zone,
 * ARN published to SSM in the deploy region under the app-keyed parameter name. RETAIN:
 * a change to the name set replaces the cert while distributions may still reference the
 * old ARN until they redeploy; retired certs are cleaned up by hand.
 */
export class DomainCertificateStack extends Stack {
  public readonly certificate: aws_certificatemanager.ICertificate;
  public readonly certRegion: string;
  public readonly domainNames: string[];

  constructor(scope: Construct, id: string, props: DomainCertificateStackProps) {
    const deployAccountId = qpqConfigAwsUtils.getApplicationModuleDeployAccountId(props.qpqConfig);
    const deployRegion = qpqConfigAwsUtils.getApplicationModuleDeployRegion(props.qpqConfig);
    const certRegion = props.certificateConfig.region;

    super(scope, id, {
      stackName: props.stackName,
      env: {
        region: certRegion,
        account: deployAccountId,
      },
    });

    this.certRegion = certRegion;
    this.domainNames = buildDomainNames(props.qpqConfig, props.certificateConfig);

    const hostedZones = Object.fromEntries(
      this.domainNames.map((domainName) => [domainName, lookupHostedZone(this, resolveHostedZoneForHost(props.qpqConfig, domainName))]),
    );

    const certificate = new aws_certificatemanager.Certificate(this, 'cert', {
      domainName: this.domainNames[0],
      subjectAlternativeNames: this.domainNames.slice(1),
      validation: aws_certificatemanager.CertificateValidation.fromDnsMultiZone(hostedZones),
    });
    // ACM certificate names are immutable, so adding, removing or reshaping a root replaces
    // the cert. Distributions and api domains keep referencing the old ARN until their own
    // stacks redeploy, and ACM refuses to delete an in-use cert, so without RETAIN this
    // update fails at cleanup and rolls back. Retained certs never expire away: list the
    // app's unused ones by these tags and delete them once every service has redeployed.
    certificate.applyRemovalPolicy(RemovalPolicy.RETAIN);
    applyApplicationTags(certificate, props.qpqConfig);
    this.certificate = certificate;

    const paramName = qpqConfigAwsUtils.getDomainCertificateArnSsmParameterName(certRegion, props.qpqConfig);

    if (certRegion === deployRegion) {
      new aws_ssm.StringParameter(this, 'arn-ssm', {
        parameterName: paramName,
        stringValue: certificate.certificateArn,
      });
    } else {
      const sdkCall = {
        service: 'SSM',
        action: 'putParameter',
        region: deployRegion,
        parameters: {
          Name: paramName,
          Value: certificate.certificateArn,
          Type: 'String',
          Overwrite: true,
        },
        physicalResourceId: PhysicalResourceId.of(paramName),
      };

      new AwsCustomResource(this, 'arn-ssm-xregion', {
        // Plain SSM put/deleteParameter: Lambda's built-in SDK is plenty; don't
        // npm-install the latest SDK at runtime (slow cold starts, needs internet).
        installLatestAwsSdk: false,
        onCreate: sdkCall,
        onUpdate: sdkCall,
        onDelete: {
          service: 'SSM',
          action: 'deleteParameter',
          region: deployRegion,
          parameters: {
            Name: paramName,
          },
        },
        policy: AwsCustomResourcePolicy.fromStatements([
          new aws_iam.PolicyStatement({
            actions: ['ssm:PutParameter', 'ssm:DeleteParameter'],
            resources: [`arn:aws:ssm:${deployRegion}:${deployAccountId}:parameter${paramName}`],
          }),
        ]),
      });
    }
  }
}
