// The website lives on the api host minus its `api.` label (the app's web entry is
// on the root domain, the api on `api.` under it). Good enough for this app's probes.
export const toWebsiteUrl = (apiBaseUrl: string): string => {
  const api = new URL(apiBaseUrl);
  return `https://${api.hostname.replace(/^api\./, '')}`;
};
