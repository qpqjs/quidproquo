import { FileUploadSettings } from '@qpqjs/webserver';

/** The upload limits with the per-file ceiling resolved: the service's own, else what API Gateway can carry. */
export type AwsFileUploadSettings = FileUploadSettings & { maxFileSizeBytes: number };
