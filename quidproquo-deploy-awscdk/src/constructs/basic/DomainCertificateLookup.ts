import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig } from 'quidproquo-core';

import { aws_certificatemanager, aws_ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Imports the region's app certificate created by the domain phase's DomainCertificateStack.
 * The ARN is read from SSM as a deploy-time token, so synth does not need the domain stack
 * deployed yet. `certRegion` is 'us-east-1' for CloudFront, the deploy region otherwise.
 */
export const lookupDomainCertificate = (
  scope: Construct,
  certRegion: string,
  qpqConfig: QPQConfig,
  idSuffix: string,
): aws_certificatemanager.ICertificate => {
  const paramName = qpqConfigAwsUtils.getDomainCertificateArnSsmParameterName(certRegion, qpqConfig);
  const certArn = aws_ssm.StringParameter.valueForStringParameter(scope, paramName);
  return aws_certificatemanager.Certificate.fromCertificateArn(scope, `domain-cert-${idSuffix}`, certArn);
};
