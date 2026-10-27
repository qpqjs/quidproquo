import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { createAwsClient } from '../createAwsClient';

/** Presigns a PUT of the object, valid for expirationMs from now. */
export const generatePresignedUploadUrl = async (
  bucketName: string,
  objectKey: string,
  region: string,
  expirationMs: number,
  correlationId?: string,
  contentType?: string,
  contentDisposition?: string,
): Promise<string> => {
  // WHEN_REQUIRED disables the SDK v3 default request checksum (CRC32). Otherwise the
  // presigner bakes an empty-body checksum (x-amz-checksum-crc32=AAAAAA==) into the signed
  // URL, which never matches the real body the browser PUTs. S3 then rejects the upload and
  // the failure surfaces in the browser as a CORS error (the error response has no ACAO header).
  const s3Client = createAwsClient(S3Client, {
    region,
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: contentType,
    // Signed into the URL: the client's PUT must send the matching Content-Disposition header, and
    // S3 stores it so later GETs serve it back (e.g. 'inline' to preview a PDF instead of downloading).
    ContentDisposition: contentDisposition,

    Metadata: {
      ...(correlationId && { 'correlation-id': correlationId }),
      'upload-timestamp': Date.now().toString(),
    },
  });

  const url = await getSignedUrl(s3Client, putObjectCommand, {
    expiresIn: expirationMs / 1000,
  });

  return url;
};
