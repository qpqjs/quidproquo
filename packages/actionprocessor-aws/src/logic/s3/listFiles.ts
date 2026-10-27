import { filePathDelimiter } from 'quidproquo-core';

import { ListObjectsV2Command, ListObjectsV2CommandInput, S3Client } from '@aws-sdk/client-s3';

import { createAwsClient } from '../createAwsClient';

export type S3FileInfo = {
  filepath: string;
  isDir: boolean;
  hashMd5?: string;
};

export type S3FileList = {
  fileInfos: S3FileInfo[];
  pageToken?: string;
};

/** Lists one page of a bucket "folder": immediate subdirectories (CommonPrefixes) followed by its files. */
export const listFiles = async (
  bucketName: string,
  region: string,
  folder: string = '',
  maxKeys: number = 1000,
  pageToken?: string,
): Promise<S3FileList> => {
  const prefix = !folder || folder.endsWith(filePathDelimiter) ? folder : `${folder}${filePathDelimiter}`;
  const bucketParams: ListObjectsV2CommandInput = {
    Bucket: bucketName,
    Delimiter: filePathDelimiter,
    Prefix: prefix,
    ContinuationToken: pageToken,
    MaxKeys: maxKeys,
  };

  const s3Client = createAwsClient(S3Client, { region });

  const response = await s3Client.send(new ListObjectsV2Command(bucketParams));

  const directoryEntries: S3FileInfo[] = (response.CommonPrefixes || [])
    .filter((commonPrefix) => !!commonPrefix.Prefix)
    .map((commonPrefix) => ({
      filepath: commonPrefix.Prefix!,
      isDir: true,
    }));

  // The listed folder can come back as its own zero-byte "folder marker" object; it is
  // the directory being listed, not a child entry.
  const fileEntries: S3FileInfo[] = (response.Contents || [])
    .filter((item) => !!item.Key && item.Key !== prefix)
    .map((item) => ({
      filepath: item.Key!,
      isDir: item.Key!.endsWith(filePathDelimiter),
      hashMd5: item.ETag,
    }));

  return {
    fileInfos: [...directoryEntries, ...fileEntries],
    pageToken: response.NextContinuationToken,
  };
};
