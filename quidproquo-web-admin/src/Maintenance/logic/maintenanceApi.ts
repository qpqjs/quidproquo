import { generateUuid, QpqPagedData } from 'quidproquo-core';
import { EventDocEvent, EventDocEventInput, EventDocSummary, MAINTENANCE_SCHEMA_VERSION, maintenanceBasePath } from 'quidproquo-features';

import { apiRequestGet, apiRequestPost } from '../../logic';

// Thin fetch layer over the maintenance event-doc REST routes
// (defineEventDocRoutes mounts them under /v1). The editor folds locally with
// maintenanceEventDoc.fold, so this only moves summaries and raw events.

const collectionPath = `/v1${maintenanceBasePath}`;

export const fetchMaintenanceSummaries = async (apiBaseUrl: string, accessToken?: string): Promise<EventDocSummary[]> =>
  apiRequestGet<EventDocSummary[]>(collectionPath, apiBaseUrl, accessToken);

export const createMaintenance = async (name: string, code: string, apiBaseUrl: string, accessToken?: string): Promise<EventDocSummary> =>
  apiRequestPost<EventDocSummary>(collectionPath, { name, code }, apiBaseUrl, accessToken);

export const fetchMaintenanceEvents = async (docId: string, apiBaseUrl: string, accessToken?: string): Promise<EventDocEvent[]> => {
  const events: EventDocEvent[] = [];
  let nextPageKey: string | undefined = undefined;

  do {
    const query: string = nextPageKey ? `?nextPageKey=${encodeURIComponent(nextPageKey)}` : '';
    const page: QpqPagedData<EventDocEvent> = await apiRequestGet<QpqPagedData<EventDocEvent>>(
      `${collectionPath}/${docId}/events${query}`,
      apiBaseUrl,
      accessToken,
    );

    events.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return events;
};

export const appendMaintenanceEvent = async (
  docId: string,
  type: string,
  data: unknown,
  apiBaseUrl: string,
  accessToken?: string,
): Promise<EventDocEvent> => {
  const input: EventDocEventInput = {
    type,
    payload: {
      data,
      metadata: {
        version: MAINTENANCE_SCHEMA_VERSION,
        clientMessageId: generateUuid(),
      },
    },
  };

  return apiRequestPost<EventDocEvent>(`${collectionPath}/${docId}/events`, input, apiBaseUrl, accessToken);
};
