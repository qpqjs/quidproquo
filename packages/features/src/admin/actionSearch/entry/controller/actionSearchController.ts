import { AskResponse, askThrowError, ErrorTypeEnum, Nullable, QpqPagedData } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse } from 'quidproquo-webserver';
import { askFromJsonEventRequest, toJsonEventResponse } from 'quidproquo-webserver';

import { ActionSearchEntityDefinition } from '../../domain/ActionSearchEntityDefinition';
import { ActionSearchEntityRow } from '../../domain/ActionSearchEntityRow';
import { ActionSearchFieldDefinition } from '../../domain/ActionSearchFieldDefinition';
import { ActionSearchFilter } from '../../domain/ActionSearchFilter';
import { ActionSearchFilterOperator } from '../../domain/ActionSearchFilterOperator';
import { GetEntityTimelineRequest } from '../../domain/GetEntityTimelineRequest';
import { ListActionRowsRequest } from '../../domain/ListActionRowsRequest';
import { ListEntityRowsRequest } from '../../domain/ListEntityRowsRequest';
import { buildKvsFilterConditions } from '../../logic/buildKvsFilterConditions';
import { matchesActionSearchFilters } from '../../logic/matchesActionSearchFilters';
import { getActionSearchDefinitionByActionType } from '../../logic/registry/getActionSearchDefinitionByActionType';
import { getActionSearchDefinitionByEntityType } from '../../logic/registry/getActionSearchDefinitionByEntityType';
import { toLookupKey } from '../../logic/toLookupKey';
import * as actionRowData from '../data/actionRowData';
import * as entityLookupData from '../data/entityLookupData';
import * as entityRowData from '../data/entityRowData';

type LookupFilterMatch = {
  filter: ActionSearchFilter;
  field: ActionSearchFieldDefinition;
};

const hasFilterValue = (value: unknown): value is string | number | boolean => value !== undefined && value !== null && value !== '';

const findLookupFilter = (filters: ActionSearchFilter[], fields: ActionSearchFieldDefinition[]): Nullable<LookupFilterMatch> => {
  for (const filter of filters) {
    const field = fields.find((fieldDefinition) => fieldDefinition.name === filter.fieldName);

    if (field?.operator === ActionSearchFilterOperator.Exact && field.hasLookup && hasFilterValue(filter.value)) {
      return { filter, field };
    }
  }

  return null;
};

// Exact lookup fields resolve through the lookup table (a key query reading only
// matches) instead of filter-scanning the entity time window
function* askListEntitiesViaLookup(
  entityDefinition: ActionSearchEntityDefinition,
  lookupFilterMatch: LookupFilterMatch,
  allFilters: ActionSearchFilter[],
  startIsoDateTime: string,
  endIsoDateTime: string,
  nextPageKey?: string,
): AskResponse<QpqPagedData<ActionSearchEntityRow>> {
  // Lookup rows store `${entityType}#${fieldName}#${value}`: the local namespace
  // a definition's lookupKeys emits must match the hasLookup field's name
  const lookupKey = toLookupKey(entityDefinition.entityType, `${lookupFilterMatch.field.name}#${lookupFilterMatch.filter.value}`);

  const lookupRows = yield* entityLookupData.askListLinkKeys(lookupKey, startIsoDateTime, endIsoDateTime, nextPageKey);

  const linkKeys = [...new Set(lookupRows.items.map((lookupRow) => lookupRow.linkKey))];
  const entities = yield* entityRowData.askGetByLinkKeys(linkKeys);

  // Any remaining filters apply in memory; the page is already lookup-sized
  const remainingFilters = allFilters.filter((filter) => filter !== lookupFilterMatch.filter);
  const filteredEntities = entities.filter((entity) => matchesActionSearchFilters(entity, remainingFilters, entityDefinition.fields));

  return {
    items: filteredEntities,
    nextPageKey: lookupRows.nextPageKey,
  };
}

export function* listActionRows(event: HTTPEvent, params: {}): AskResponse<HTTPEventResponse> {
  const { actionType, startIsoDateTime, endIsoDateTime, filters, nextPageKey } = yield* askFromJsonEventRequest<ListActionRowsRequest>(event);

  const definition = getActionSearchDefinitionByActionType(actionType);
  if (!definition) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Unknown action type [${actionType}]`);
  }

  const filter = buildKvsFilterConditions(filters ?? [], definition.action.fields);

  const actionRows = yield* actionRowData.askListByActionType(actionType, startIsoDateTime, endIsoDateTime, filter ?? undefined, nextPageKey);

  return toJsonEventResponse(actionRows);
}

export function* listEntityRows(event: HTTPEvent, params: {}): AskResponse<HTTPEventResponse> {
  const { entityType, startIsoDateTime, endIsoDateTime, filters, nextPageKey } = yield* askFromJsonEventRequest<ListEntityRowsRequest>(event);

  const entityDefinition = getActionSearchDefinitionByEntityType(entityType)?.entity;
  if (!entityDefinition) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Unknown entity type [${entityType}]`);
  }

  const allFilters = filters ?? [];

  const lookupFilterMatch = findLookupFilter(allFilters, entityDefinition.fields);
  if (lookupFilterMatch) {
    const entities = yield* askListEntitiesViaLookup(entityDefinition, lookupFilterMatch, allFilters, startIsoDateTime, endIsoDateTime, nextPageKey);

    return toJsonEventResponse(entities);
  }

  const filter = buildKvsFilterConditions(allFilters, entityDefinition.fields);

  const entities = yield* entityRowData.askListByEntityType(entityType, startIsoDateTime, endIsoDateTime, filter ?? undefined, nextPageKey);

  return toJsonEventResponse(entities);
}

export function* getEntityTimeline(event: HTTPEvent, params: {}): AskResponse<HTTPEventResponse> {
  const { linkKey } = yield* askFromJsonEventRequest<GetEntityTimelineRequest>(event);

  const actionRows = yield* actionRowData.askListAllByLinkKey(linkKey);

  const sortedActionRows = [...actionRows].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  return toJsonEventResponse(sortedActionRows);
}
