import { QPQConfig } from '@qpqjs/core';
import { DomainResolver } from '@qpqjs/webserver';

/** The app's domain resolver for a service's config, or undefined for the default resolver. */
export type WebAddressingResolver = (qpqConfig: QPQConfig) => DomainResolver | undefined;
