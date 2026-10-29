import { awsNamingUtils } from '@qpqjs/actionprocessor-aws';
import { resolveAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';
import {
  ContentSecurityPolicyEntry,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  qpqWebServerUtils,
  ResponseHeadersContentSecurityPolicy,
  ResponseHeadersContentTypeOptions,
  ResponseHeadersFrameOptions,
  ResponseHeadersReferrerPolicy,
  ResponseHeadersStrictTransportSecurity,
  ResponseHeadersXSSProtection,
  ResponseSecurityHeaders,
} from '@qpqjs/webserver';

import { aws_cloudfront } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';

import { requireDomainResolver } from '../../../../../appWorkspace/requireDomainResolver';

const convertStrictTransportSecurity = (
  strictTransportSecurity?: ResponseHeadersStrictTransportSecurity,
): aws_cloudfront.ResponseHeadersStrictTransportSecurity | undefined => {
  if (!strictTransportSecurity) {
    return {
      override: true,
      accessControlMaxAge: cdk.Duration.hours(1),
      includeSubdomains: true,
      preload: true,
    };
  }

  return {
    accessControlMaxAge: cdk.Duration.seconds(strictTransportSecurity.accessControlMaxAgeInSeconds),
    override: strictTransportSecurity.override,
    includeSubdomains: strictTransportSecurity.includeSubdomains,
    preload: strictTransportSecurity.preload,
  };
};

// Builds the exact virtual-hosted S3 endpoints the browser needs in `connect-src`
// so it can fetch/upload presigned ("secure") URLs. Each storage drive (owned or
// referenced from another service) resolves to a deterministic bucket name and its
// owner's region, mirroring the enumeration in
// `QpqCoreStorageDriveConstruct.authorizeActionsForRole`. This replaces the previous
// `https://*.amazonaws.com` wildcard, which allowed connections to any AWS endpoint.
const getStorageDriveConnectSrcDomains = (qpqConfig: QPQConfig): string[] => {
  const domains = qpqCoreUtils.getAllStorageDriveConfigs(qpqConfig).map((cfg) => {
    const bucketName = awsNamingUtils.resolveOwnedResourceName(cfg.storageDrive, qpqConfig, cfg.owner);
    const { awsRegion } = resolveAwsServiceAccountInfo(qpqConfig, cfg.owner);

    return `https://${bucketName}.s3.${awsRegion}.amazonaws.com`;
  });

  return [...new Set(domains)];
};

export const convertContentSecurityPolicy = (
  qpqConfig: QPQConfig,
  contentSecurityPolicy?: ResponseHeadersContentSecurityPolicy,
): aws_cloudfront.ResponseHeadersContentSecurityPolicy | undefined => {
  const domainResolver = requireDomainResolver(qpqConfig);

  if (!contentSecurityPolicy) {
    return {
      contentSecurityPolicy: "default-src 'self'; object-src 'none'",
      override: true,
    };
  }

  const contentSecurityPolicyCopy: Record<string, ContentSecurityPolicyEntry[]> = {
    ...contentSecurityPolicy.contentSecurityPolicy,

    // Auto add the secure (presigned) S3 endpoints for this service's storage drives,
    // scoped to the specific bucket + region instead of a wildcard.
    'connect-src': [...(contentSecurityPolicy.contentSecurityPolicy['connect-src'] || []), ...getStorageDriveConnectSrcDomains(qpqConfig)],
  };

  return {
    contentSecurityPolicy: Object.entries(contentSecurityPolicyCopy)
      .map(([directive, entries]) =>
        [directive, ...entries.flatMap((entry) => qpqWebServerUtils.resolveContentSecurityPolicyEntry(qpqConfig, entry, domainResolver))].join(' '),
      )
      .join('; '),
    override: contentSecurityPolicy.override,
  };
};

const convertContentTypeOptions = (
  contentTypeOptions?: ResponseHeadersContentTypeOptions,
): aws_cloudfront.ResponseHeadersContentTypeOptions | undefined => {
  if (!contentTypeOptions) {
    return {
      override: true,
    };
  }

  return {
    override: contentTypeOptions.override,
  };
};

const convertFrameOptions = (frameOptions?: ResponseHeadersFrameOptions): aws_cloudfront.ResponseHeadersFrameOptions | undefined => {
  if (!frameOptions) {
    return {
      frameOption: aws_cloudfront.HeadersFrameOption.DENY,
      override: true,
    };
  }

  const frameOptionMap = {
    [HeadersFrameOption.DENY]: aws_cloudfront.HeadersFrameOption.DENY,
    [HeadersFrameOption.SAMEORIGIN]: aws_cloudfront.HeadersFrameOption.SAMEORIGIN,
  };

  return {
    frameOption: frameOptionMap[frameOptions.frameOption],
    override: frameOptions.override,
  };
};

const convertReferrerPolicy = (referrerPolicy?: ResponseHeadersReferrerPolicy): aws_cloudfront.ResponseHeadersReferrerPolicy | undefined => {
  if (!referrerPolicy) {
    return {
      referrerPolicy: aws_cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
      override: true,
    };
  }

  const referrerPolicyMap = {
    [HeadersReferrerPolicy.NO_REFERRER]: aws_cloudfront.HeadersReferrerPolicy.NO_REFERRER,
    [HeadersReferrerPolicy.NO_REFERRER_WHEN_DOWNGRADE]: aws_cloudfront.HeadersReferrerPolicy.NO_REFERRER_WHEN_DOWNGRADE,
    [HeadersReferrerPolicy.ORIGIN]: aws_cloudfront.HeadersReferrerPolicy.ORIGIN,
    [HeadersReferrerPolicy.ORIGIN_WHEN_CROSS_ORIGIN]: aws_cloudfront.HeadersReferrerPolicy.ORIGIN_WHEN_CROSS_ORIGIN,
    [HeadersReferrerPolicy.SAME_ORIGIN]: aws_cloudfront.HeadersReferrerPolicy.SAME_ORIGIN,
    [HeadersReferrerPolicy.STRICT_ORIGIN]: aws_cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN,
    [HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN]: aws_cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
    [HeadersReferrerPolicy.UNSAFE_URL]: aws_cloudfront.HeadersReferrerPolicy.UNSAFE_URL,
  };

  return {
    referrerPolicy: referrerPolicyMap[referrerPolicy.referrerPolicy],
    override: referrerPolicy.override,
  };
};

const convertXssProtection = (xssProtection?: ResponseHeadersXSSProtection): aws_cloudfront.ResponseHeadersXSSProtection | undefined => {
  if (!xssProtection) {
    return {
      protection: true,
      modeBlock: true,
      override: true,
    };
  }

  return {
    protection: xssProtection.protection,
    modeBlock: xssProtection.modeBlock,
    override: xssProtection.override,
  };
};

/**
 * The baseline headers always apply; a content security policy is only added when the app declares
 * `securityHeaders`, because the default `'self'` policy would break a shell that loads views from
 * another host.
 */
export const convertSecurityHeadersFromQpqSecurityHeaders = (
  qpqConfig: QPQConfig,
  securityHeaders?: ResponseSecurityHeaders,
): aws_cloudfront.ResponseSecurityHeadersBehavior => {
  return {
    contentSecurityPolicy: securityHeaders ? convertContentSecurityPolicy(qpqConfig, securityHeaders.contentSecurityPolicy) : undefined,
    contentTypeOptions: convertContentTypeOptions(securityHeaders?.contentTypeOptions),
    frameOptions: convertFrameOptions(securityHeaders?.frameOptions),
    referrerPolicy: convertReferrerPolicy(securityHeaders?.referrerPolicy),
    xssProtection: convertXssProtection(securityHeaders?.xssProtection),
    strictTransportSecurity: convertStrictTransportSecurity(securityHeaders?.strictTransportSecurity),
  };
};
