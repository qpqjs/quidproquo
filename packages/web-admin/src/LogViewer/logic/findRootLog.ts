import { StoryResultMetadata } from 'quidproquo-core';

import { apiRequestGet, cache } from '../../logic';

export const findRootLog = cache(async function findRootLog(
  apiBaseUrl: string,
  fromCorrelation?: string,
  accessToken?: string,
): Promise<StoryResultMetadata | undefined> {
  if (!fromCorrelation) {
    return;
  }

  try {
    const parentLog = await apiRequestGet<StoryResultMetadata>(`/log/${fromCorrelation}`, apiBaseUrl, accessToken);

    return (await findRootLog(apiBaseUrl, parentLog?.fromCorrelation, accessToken)) || parentLog;
  } catch (error) {
    console.error(`Error fetching parent log for correlation ${fromCorrelation}:`, error);
    return;
  }
});
