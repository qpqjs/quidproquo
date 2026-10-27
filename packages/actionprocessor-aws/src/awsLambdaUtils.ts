import { HTTPMethod, Nullable, StorageDriveTier } from 'quidproquo-core';
import { qpqWebServerUtils, RouteQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { randomUUID } from 'crypto';
import { match } from 'node-match-path';
import { StorageClass } from '@aws-sdk/client-s3';

export const randomGuid = () => {
  return randomUUID();
};

export type UrlMatch = {
  didMatch: boolean;
  params: Nullable<Record<string, string>>;
};

/** Matches a url against a `{param}` templated route path, extracting the path params on a hit. */
export const matchUrl = (path: string, url: string): UrlMatch => {
  // /attempt/{attemptUuid}/result/{test} => /attempt/:attemptUuid/result/:test
  const modifiedPath = path.replaceAll(/{(.+?)}/g, (m, g) => `:${g}`);

  const matchResult = match(modifiedPath, url);
  return {
    didMatch: matchResult.matches,
    params: matchResult.params,
  };
};

export type FoundApiRoute = {
  route: RouteQPQWebServerConfigSetting;
  match: UrlMatch;
};

/**
 * The most specific route for a request, or null. An OPTIONS preflight matches a route of any method
 * on the path, and HEAD matches GET. Shared by route matching and the response's CORS headers (here
 * and in the local dev server), so they always settle on the same route.
 */
export const findApiRoute = (routes: RouteQPQWebServerConfigSetting[], method: HTTPMethod, path: string): Nullable<FoundApiRoute> => {
  const candidates = routes.filter((r) => r.method === method || method === 'OPTIONS' || (method === 'HEAD' && r.method === 'GET'));

  // Note: We may need to filter variable routes out {} as the variables are length independent
  return (
    qpqWebServerUtils
      .sortPathMatchConfigs(candidates)
      .map((route) => ({ route, match: matchUrl(route.path, path) }))
      .find((found) => found.match.didMatch) ?? null
  );
};

/** Maps a qpq storage drive tier to its S3 storage class. An unset tier lets S3 pick (INTELLIGENT_TIERING). */
export const getS3BucketStorageClassFromStorageDriveTier = (driveTier?: StorageDriveTier): keyof typeof StorageClass => {
  switch (driveTier) {
    case StorageDriveTier.REGULAR:
      return 'STANDARD';
    case StorageDriveTier.OCCASIONAL_ACCESS:
      return 'STANDARD_IA';
    case StorageDriveTier.SINGLE_ZONE_OCCASIONAL_ACCESS:
      return 'ONEZONE_IA';
    case StorageDriveTier.COLD_STORAGE:
      return 'GLACIER';
    case StorageDriveTier.COLD_STORAGE_INSTANT_ACCESS:
      return 'GLACIER_IR';
    case StorageDriveTier.DEEP_COLD_STORAGE:
      return 'DEEP_ARCHIVE';
    case StorageDriveTier.SMART_TIERING:
      return 'INTELLIGENT_TIERING';
    default:
      return 'INTELLIGENT_TIERING';
  }
};
