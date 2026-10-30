// The bucket and key behind a presigned S3 URL, virtual-hosted (bucket.s3.region...) or
// path-style (s3.region.../bucket/key). The lockdown test learns the real bucket this way
// rather than rebuilding the name from config.
export const parseS3ObjectFromUrl = (url: string): { bucket: string; key: string } => {
  const { hostname, pathname } = new URL(url);
  const segments = pathname.split('/').slice(1).map(decodeURIComponent);

  if (hostname.startsWith('s3.') || hostname.startsWith('s3-')) {
    return { bucket: segments[0], key: segments.slice(1).join('/') };
  }
  return { bucket: hostname.split('.s3')[0], key: segments.join('/') };
};
