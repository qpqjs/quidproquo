import { SessionSeededParams } from '../../types/SessionSeededParams';

const searchParamKeys = ['runtimeType', 'service', 'startIsoDateTime', 'endIsoDateTime', 'user', 'info', 'msg', 'error', 'deep', 'logLevel'] as const;

// Pure: maps the URL query params present at boot into the session's seed —
// the last moment the URL acts as an input; afterwards it is a projection.
export const seededParamsFromQueryParams = (queryParams: Record<string, string[]>): SessionSeededParams => {
  const seeded: SessionSeededParams = {};

  for (const key of searchParamKeys) {
    const value = queryParams[key]?.[0];
    if (value) {
      seeded[key] = value;
    }
  }

  const tab = queryParams['tab']?.[0];
  if (tab && !Number.isNaN(parseInt(tab))) {
    seeded.tab = parseInt(tab);
  }

  const correlation = queryParams['correlation']?.[0];
  if (correlation) {
    seeded.correlation = correlation;
  }

  return seeded;
};
