import { QpqjsServiceEnum } from '@qpqjs/constants';
import {
  askConfigGetApplicationInfo,
  askNetworkRequest,
  AskResponse,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

// The app deploys to one region; the bucket's regional endpoint is the one a
// direct reader would try.
const WEBSITE_BUCKET_REGION = 'ap-southeast-2';

// Both spellings the web entry construct has used for the shell site's bucket:
// the live name today and the suffixed form the construct derives.
const toWebsiteBucketNames = (
  application: string,
  environment: string,
  feature?: string
): string[] => {
  const base = [
    'website',
    application,
    QpqjsServiceEnum.Shell,
    environment,
    feature,
  ]
    .filter(Boolean)
    .join('-');

  return [base, `${base}-qpqwe`];
};

// Checklist item: web stack. The site is served through CloudFront with origin
// access control, so the bucket itself must refuse an anonymous read: a 403 from
// the regional endpoint, never the page. A 404 means the name is not this
// deployment's bucket and proves nothing, so at least one name must answer 403.
export function* askRunWebsiteBucketNotPublicTest(): AskResponse<void> {
  const info = yield* askConfigGetApplicationInfo();
  const bucketNames = toWebsiteBucketNames(
    info.name,
    info.environment,
    info.feature
  );

  const statuses: number[] = [];
  for (const bucketName of bucketNames) {
    const url = `https://${bucketName}.s3.${WEBSITE_BUCKET_REGION}.amazonaws.com/index.html`;
    const response = yield* askNetworkRequest<undefined, string>('GET', url, {
      responseType: 'text',
    });

    yield* askSmokeAssert(
      response.status !== 200 && !response.data.includes('<script'),
      `the website bucket serves its pages directly [${response.status}] from ${url}`
    );
    statuses.push(response.status);
  }

  yield* askSmokeAssert(
    statuses.includes(403),
    `no website bucket answered 403; statuses were [${statuses.join(', ')}] for ${bucketNames.join(', ')}`
  );
}
