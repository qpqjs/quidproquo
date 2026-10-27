import { QPQConfig } from 'quidproquo-core';
import { DomainResolver } from 'quidproquo-webserver';

/** The app's domain resolver for a service's config, or undefined for the default resolver. */
export type WebAddressingResolver = (qpqConfig: QPQConfig) => DomainResolver | undefined;
