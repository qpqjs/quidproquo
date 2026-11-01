import { QPQConfig } from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';

import { API_GATEWAY_MAX_PAYLOAD_BYTES } from '../constants';
import { AwsFileUploadSettings } from './AwsFileUploadSettings';

/** The service's upload limits with `maxFileSizeBytes` filled from the API Gateway payload cap when it declares none. */
export const getAwsFileUploadSettings = (qpqConfig: QPQConfig): AwsFileUploadSettings => {
  const settings = qpqWebServerUtils.getFileUploadSettings(qpqConfig);

  return { ...settings, maxFileSizeBytes: settings.maxFileSizeBytes ?? API_GATEWAY_MAX_PAYLOAD_BYTES };
};
