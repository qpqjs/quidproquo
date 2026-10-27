import fs from 'fs';
import path from 'path';

// The consumer repo root — qpq always runs from the workspace root (npm
// scripts set cwd there).
export const getRoot = (): string => process.cwd();

export const getAppsDirectory = (): string => path.join(getRoot(), 'apps');
export const getAppDirectory = (appName: string): string => path.join(getAppsDirectory(), appName);
export const getServiceDirectory = (appName: string, service: string): string => path.join(getAppDirectory(appName), 'services', service);

// Apps are the directories under apps/ that contain a services/ directory.
export const getAvailableApps = (): string[] => {
  const appsPath = getAppsDirectory();

  if (!fs.existsSync(appsPath)) {
    return [];
  }

  return fs.readdirSync(appsPath).filter((name) => {
    const servicesPath = path.join(getAppDirectory(name), 'services');
    return fs.statSync(getAppDirectory(name)).isDirectory() && fs.existsSync(servicesPath) && fs.statSync(servicesPath).isDirectory();
  });
};

// Every service directory under an app's services/ folder (no subdir filter).
export const getAllServiceNames = (appName: string): string[] => {
  const directoryPath = path.join(getAppDirectory(appName), 'services');

  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs.readdirSync(directoryPath).filter((name) => fs.statSync(getServiceDirectory(appName, name)).isDirectory());
};

// True when a service contains the given child directory (e.g. 'service' for a
// backend, 'views' for a frontend).
export const serviceHasSubdir = (appName: string, service: string, subdir: string): boolean => {
  const subdirPath = path.join(getServiceDirectory(appName, service), subdir);
  return fs.existsSync(subdirPath) && fs.statSync(subdirPath).isDirectory();
};

// Services that contain a given child directory.
export const getServiceNamesWithSubdir = (appName: string, subdir: string): string[] =>
  getAllServiceNames(appName).filter((service) => serviceHasSubdir(appName, service, subdir));

// Backend services — those with a service/ subdir.
export const getServiceNames = (appName: string): string[] => getServiceNamesWithSubdir(appName, 'service');

// Backend services that also ship a frontend (views/ subdir).
export const getServiceNamesWithViews = (appName: string): string[] =>
  getServiceNames(appName).filter((service) => serviceHasSubdir(appName, service, 'views'));
