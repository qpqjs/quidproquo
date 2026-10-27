import { CertificateQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';

export interface QpqWebserverCertificateConstructProps extends QpqConstructBlockProps {
  certificateConfig: CertificateQPQWebServerConfigSetting;
}

/**
 * No-op shim kept for backwards compatibility with user configs that still call `defineCertificate`.
 *
 * Certificates are now created centrally by `DomainCertificateStack` via `defineDomainCertificate`
 * in the bootstrap qpqConfig, and consumed by service constructs via `lookupDomainCertificate`.
 * This construct no longer creates any AWS resources. It exists only so that existing calls to
 * `defineCertificate` in downstream configs do not cause the inf stack's construct assembly to fail.
 */
export class QpqWebserverCertificateConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqWebserverCertificateConstructProps) {
    super(scope, id, props);
    // Intentionally empty — see class docstring.
  }
}
