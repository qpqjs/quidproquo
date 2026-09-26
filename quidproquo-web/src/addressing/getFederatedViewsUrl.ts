import { FEDERATED_VIEWS_SUBDOMAIN } from 'quidproquo-webserver';

import { getWebAddressing } from './getWebAddressing';
import { getWebEntryUrl } from './getWebEntryUrl';
import { WebLocation } from './WebLocation';

/** Base url of a service's federated views bundle (its mf-manifest.json lives directly under it). */
export const getFederatedViewsUrl = (service: string, location: WebLocation = window.location): string => {
  const viewsEntry = getWebAddressing().entries.find((entry) => entry.path === `/${FEDERATED_VIEWS_SUBDOMAIN}`);
  if (!viewsEntry) {
    throw new Error(`No web entry on the '${FEDERATED_VIEWS_SUBDOMAIN}' subdomain is known to this bundle`);
  }
  return `${getWebEntryUrl(viewsEntry.name, viewsEntry.service, location)}/${service}`;
};
