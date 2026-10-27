import { QpqPagedData, StoryResultMetadata } from 'quidproquo-core';

import { apiRequestGet, cache } from '../../logic';

export const fineLogDirectChildren = cache(async function findLogDirectChildren(
  logCorrelation: string,
  apiBaseUrl: string,
  accessToken?: string,
): Promise<StoryResultMetadata[]> {
  try {
    // TODO: Paging
    const fetchedChildLogs = await apiRequestGet<QpqPagedData<StoryResultMetadata>>(`/log/children/${logCorrelation}`, apiBaseUrl, accessToken);

    return fetchedChildLogs.items;
  } catch (error) {
    console.error(`Error fetching child logs for correlation ${logCorrelation}:`, error);
    return [];
  }
});
