import { CertificateQPQWebServerConfigSetting } from '@qpqjs/webserver';

import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqWebserverCertificateConstructProps extends QpqConstructBlockProps {
  certificateConfig: CertificateQPQWebServerConfigSetting;
}

/**
 * No-op kept so user configs that still call `defineCertificate` assemble cleanly.
 *
 * Certificates are created centrally by `DomainCertificateStack` via `defineDomainCertificate`
 * in the bootstrap qpqConfig, and consumed by service constructs via `lookupDomainCertificate`.
 * This construct creates no AWS resources.
 */
export class QpqWebserverCertificateConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqWebserverCertificateConstructProps) {
    super(scope, id, props);
    // Intentionally empty: see class docstring.
  }
}
