import { WebAddressing } from 'quidproquo-webserver';

/**
 * Which of the app's root domains the page is on (longest match), as an index into every
 * `hosts` array. A page on no known root uses the primary root.
 */
export const getPageRootIndex = (addressing: WebAddressing, hostname: string): number => {
  if (addressing.mode !== 'subdomain') {
    return 0;
  }

  const page = hostname.toLowerCase();
  let best = -1;
  addressing.rootDomains.forEach((root, index) => {
    const rootName = root.toLowerCase();
    const matches = page === rootName || page.endsWith(`.${rootName}`);
    if (matches && (best === -1 || rootName.length > addressing.rootDomains[best].length)) {
      best = index;
    }
  });

  return best === -1 ? 0 : best;
};
