import { QPQConfig } from '@qpqjs/core';
import { FileUploadSettings, qpqWebServerUtils } from '@qpqjs/webserver';

import { API_GATEWAY_MAX_PAYLOAD_BYTES } from './awsLimits';

/** The upload limits with the per-file ceiling resolved: the service's own, else what API Gateway can carry. */
export type AwsFileUploadSettings = FileUploadSettings & { maxFileSizeBytes: number };

export const getAwsFileUploadSettings = (qpqConfig: QPQConfig): AwsFileUploadSettings => {
  const settings = qpqWebServerUtils.getFileUploadSettings(qpqConfig);

  return { ...settings, maxFileSizeBytes: settings.maxFileSizeBytes ?? API_GATEWAY_MAX_PAYLOAD_BYTES };
};
