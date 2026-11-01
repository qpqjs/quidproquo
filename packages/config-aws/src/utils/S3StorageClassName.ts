/** The S3 storage class names a storage drive tier maps to, as both the S3 SDK and CloudFormation spell them. */
export type S3StorageClassName = 'STANDARD' | 'STANDARD_IA' | 'ONEZONE_IA' | 'GLACIER' | 'GLACIER_IR' | 'DEEP_ARCHIVE' | 'INTELLIGENT_TIERING';
