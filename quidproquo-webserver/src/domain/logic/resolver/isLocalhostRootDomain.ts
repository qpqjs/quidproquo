/** `localhost` with or without a port; the dev server rewrites roots to this. */
export const isLocalhostRootDomain = (rootDomain: string): boolean => rootDomain.split(':')[0].toLowerCase() === 'localhost';
