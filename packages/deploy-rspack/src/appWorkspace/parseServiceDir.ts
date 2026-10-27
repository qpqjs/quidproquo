import path from 'path';

export type ServiceDirParts = {
  root: string;
  appName: string;
  serviceName: string;
};

/**
 * Splits an apps/<app>/services/<svc>/<leaf> directory into repo root, app name
 * and service name. `leaf` is the expected final segment ('service' for backend
 * builds, 'views' for microfrontends); anything else throws so a misplaced
 * directory fails loudly instead of producing paths in the wrong place.
 */
export const parseServiceDir = (serviceDir: string, leaf: string): ServiceDirParts => {
  const parts = serviceDir.split(path.sep);
  const appsIdx = parts.lastIndexOf('apps');
  if (appsIdx < 0 || parts[appsIdx + 2] !== 'services' || parts[appsIdx + 4] !== leaf) {
    throw new Error(`Expected apps/<app>/services/<svc>/${leaf}, got ${serviceDir}`);
  }

  return {
    root: parts.slice(0, appsIdx).join(path.sep),
    appName: parts[appsIdx + 1],
    serviceName: parts[appsIdx + 3],
  };
};
