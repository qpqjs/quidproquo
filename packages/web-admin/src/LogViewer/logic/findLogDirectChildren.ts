import { QpqPagedData, StoryResultMetadata } from '@qpqjs/core';

import { apiRequestGet, cache } from '../../logic';
import { encodeLogPathSegment } from './encodeLogPathSegment';

export const fineLogDirectChildren = cache(async function findLogDirectChildren(
  logCorrelation: string,
  apiBaseUrl: string,
  accessToken?: string,
): Promise<StoryResultMetadata[]> {
  try {
    // TODO: Paging
    const fetchedChildLogs = await apiRequestGet<QpqPagedData<StoryResultMetadata>>(
      `/log/children/${encodeLogPathSegment(logCorrelation)}`,
      apiBaseUrl,
      accessToken,
    );

    return fetchedChildLogs.items;
  } catch (error) {
    console.error(`Error fetching child logs for correlation ${logCorrelation}:`, error);
    return [];
  }
});
