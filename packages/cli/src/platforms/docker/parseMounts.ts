export type Mount = {
  // Absolute folder on the docker host, e.g. /mnt/user/media/downloads.
  host: string;
  // Where it appears inside the container.
  container: string;
  readOnly: boolean;
};

// host:container, both absolute, optionally ending :ro or :rw.
const MOUNT_PATTERN = /^(\/[^:]*):(\/[^:]*?)(?::(ro|rw))?$/;

// The image's own files live under /app (including the state directory), so a mount there would
// hide them.
const IMAGE_ROOT = '/app';

const trimTrailingSlashes = (folder: string): string => folder.replace(/\/+$/, '') || '/';

/** Parses "host:container[:ro], ..." into mounts, throwing naming the first malformed item. */
export const parseMounts = (value: string): Mount[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = MOUNT_PATTERN.exec(item);
      if (!match) {
        throw new Error(`Mount '${item}' must be host:container with both absolute, optionally ending :ro, e.g. /mnt/user/media:/media`);
      }

      const container = trimTrailingSlashes(match[2]);
      if (container === IMAGE_ROOT || container.startsWith(`${IMAGE_ROOT}/`) || container === '/') {
        throw new Error(`Mount '${item}' would cover the image's own files: mount it somewhere other than / or ${IMAGE_ROOT}`);
      }

      return { host: trimTrailingSlashes(match[1]), container, readOnly: match[3] === 'ro' };
    });
