/** One packed workspace in a release's manifest.json, written by releasePack.ts and read by releasePublish.mts. `tarball` is relative to the manifest. */
export type ReleasePackage = {
  name: string;
  version: string;
  tarball: string;
};
