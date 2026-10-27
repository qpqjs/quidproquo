// This is all taken from AWS to make the mapping easier
// but still needs to be mapped correctly
export declare enum HeadersFrameOption {
  /**
   * The page can only be displayed in a frame on the same origin as the page itself.
   */
  DENY = 'DENY',
  /**
   * The page can only be displayed in a frame on the specified origin.
   */
  SAMEORIGIN = 'SAMEORIGIN',
}

/**
 * Enum representing possible values of the Referrer-Policy HTTP response header.
 */
export declare enum HeadersReferrerPolicy {
  /**
   * The referrer policy is not set.
   */
  NO_REFERRER = 'no-referrer',
  /**
   * The referrer policy is no-referrer-when-downgrade.
   */
  NO_REFERRER_WHEN_DOWNGRADE = 'no-referrer-when-downgrade',
  /**
   * The referrer policy is origin.
   */
  ORIGIN = 'origin',
  /**
   * The referrer policy is origin-when-cross-origin.
   */
  ORIGIN_WHEN_CROSS_ORIGIN = 'origin-when-cross-origin',
  /**
   * The referrer policy is same-origin.
   */
  SAME_ORIGIN = 'same-origin',
  /**
   * The referrer policy is strict-origin.
   */
  STRICT_ORIGIN = 'strict-origin',
  /**
   * The referrer policy is strict-origin-when-cross-origin.
   */
  STRICT_ORIGIN_WHEN_CROSS_ORIGIN = 'strict-origin-when-cross-origin',
  /**
   * The referrer policy is unsafe-url.
   */
  UNSAFE_URL = 'unsafe-url',
}

export interface QpqServiceContentSecurityPolicy {
  /**
   * The name of the api subdomain name for the given service
   */
  api: string;
  /**
   * The domain name the service is hosted on, if left undefined, the domain name of this service will be used
   */
  domain?: string;
  /**
   * The service name, as seen in the subdomain
   */
  service?: string;

  /**
   * The protocol to use, defaults to https
   */
  protocol?: 'http' | 'https' | 'ws' | 'wss';
}

/**
 * CSP Entry ~ a string or a complex service type
 */
export type ContentSecurityPolicyEntry = QpqServiceContentSecurityPolicy | string;

/**
 * The policy directives and their values that CDN includes as values for the Content-Security-Policy HTTP response header.
 */
export interface ResponseHeadersContentSecurityPolicy {
  /**
   * The policy directives and their values that CDN includes as values for the Content-Security-Policy HTTP response header.
   */
  readonly contentSecurityPolicy: Record<string, ContentSecurityPolicyEntry[]>;
  /**
   * A Boolean that determines whether CDN overrides the Content-Security-Policy HTTP response header
   * received from the origin with the one specified in this response headers policy.
   */
  readonly override: boolean;
}

/**
 * Determines whether CDN includes the X-Content-Type-Options HTTP response header with its value set to nosniff.
 */
export interface ResponseHeadersContentTypeOptions {
  /**
   * A Boolean that determines whether CDN overrides the X-Content-Type-Options HTTP response header
   * received from the origin with the one specified in this response headers policy.
   */
  readonly override: boolean;
}

/**
 * Determines whether CDN includes the X-Frame-Options HTTP response header and the header’s value.
 */
export interface ResponseHeadersFrameOptions {
  /**
   * The value of the X-Frame-Options HTTP response header.
   */
  readonly frameOption: HeadersFrameOption;
  /**
   * A Boolean that determines whether CDN overrides the X-Frame-Options HTTP response header
   * received from the origin with the one specified in this response headers policy.
   */
  readonly override: boolean;
}

/**
 * Determines whether CDN includes the Referrer-Policy HTTP response header and the header’s value.
 */
export interface ResponseHeadersReferrerPolicy {
  /**
   * The value of the Referrer-Policy HTTP response header.
   */
  readonly referrerPolicy: HeadersReferrerPolicy;
  /**
   * A Boolean that determines whether CDN overrides the Referrer-Policy HTTP response header
   * received from the origin with the one specified in this response headers policy.
   */
  readonly override: boolean;
}

/**
 * Determines whether CDN includes the Strict-Transport-Security HTTP response header and the header’s value.
 */
export interface ResponseHeadersStrictTransportSecurity {
  /**
   * A number that CDN uses as the value for the max-age directive in the Strict-Transport-Security HTTP response header.
   */
  readonly accessControlMaxAgeInSeconds: number;
  /**
   * A Boolean that determines whether CDN includes the includeSubDomains directive in the Strict-Transport-Security HTTP response header.
   *
   * @default false
   */
  readonly includeSubdomains?: boolean;
  /**
   * A Boolean that determines whether CDN overrides the Strict-Transport-Security HTTP response header
   * received from the origin with the one specified in this response headers policy.
   */
  readonly override: boolean;
  /**
   * A Boolean that determines whether CDN includes the preload directive in the Strict-Transport-Security HTTP response header.
   *
   * @default false
   */
  readonly preload?: boolean;
}

/**
 * Determines whether CDN includes the X-XSS-Protection HTTP response header and the header’s value.
 */
export interface ResponseHeadersXSSProtection {
  /**
   * A Boolean that determines whether CDN includes the mode=block directive in the X-XSS-Protection header.
   *
   * @default false
   */
  readonly modeBlock?: boolean;
  /**
   * A Boolean that determines whether CDN overrides the X-XSS-Protection HTTP response header
   * received from the origin with the one specified in this response headers policy.
   */
  readonly override: boolean;
  /**
   * A Boolean that determines the value of the X-XSS-Protection HTTP response header.
   * When this setting is true, the value of the X-XSS-Protection header is 1.
   * When this setting is false, the value of the X-XSS-Protection header is 0.
   */
  readonly protection: boolean;
  /**
   * A reporting URI, which CDN uses as the value of the report directive in the X-XSS-Protection header.
   * You cannot specify a ReportUri when ModeBlock is true.
   *
   * @default - no report uri
   */
  readonly reportUri?: string;
}

/**
 * Configuration for a set of security-related HTTP response headers.
 * CDN adds these headers to HTTP responses that it sends for requests that match a cache behavior
 * associated with this response headers policy.
 */
export interface ResponseSecurityHeaders {
  /**
   * The policy directives and their values that CDN includes as values for the Content-Security-Policy HTTP response header.
   *
   * @default - no content security policy
   */
  readonly contentSecurityPolicy?: ResponseHeadersContentSecurityPolicy;
  /**
   * Determines whether CDN includes the X-Content-Type-Options HTTP response header with its value set to nosniff.
   *
   * @default - no content type options
   */
  readonly contentTypeOptions?: ResponseHeadersContentTypeOptions;
  /**
   * Determines whether CDN includes the X-Frame-Options HTTP response header and the header’s value.
   *
   * @default - no frame options
   */
  readonly frameOptions?: ResponseHeadersFrameOptions;
  /**
   * Determines whether CDN includes the Referrer-Policy HTTP response header and the header’s value.
   *
   * @default - no referrer policy
   */
  readonly referrerPolicy?: ResponseHeadersReferrerPolicy;
  /**
   * Determines whether CDN includes the Strict-Transport-Security HTTP response header and the header’s value.
   *
   * @default - no strict transport security
   */
  readonly strictTransportSecurity?: ResponseHeadersStrictTransportSecurity;
  /**
   * Determines whether CDN includes the X-XSS-Protection HTTP response header and the header’s value.
   *
   * @default - no xss protection
   */
  readonly xssProtection?: ResponseHeadersXSSProtection;
}
