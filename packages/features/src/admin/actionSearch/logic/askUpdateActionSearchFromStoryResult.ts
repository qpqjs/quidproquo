import {
  ActionHistory,
  ActionProcessorResult,
  askMap,
  AskResponse,
  filterLogHistoryByActionTypes,
  isErroredActionResult,
  resolveActionResultError,
  StoryResult,
} from 'quidproquo-core';

import { ActionSearchActionRow } from '../domain/ActionSearchActionRow';
import { ActionSearchEntityDefinition } from '../domain/ActionSearchEntityDefinition';
import { ActionSearchEntityRow } from '../domain/ActionSearchEntityRow';
import { ActionSearchLookupRow } from '../domain/ActionSearchLookupRow';
import * as actionRowData from '../entry/data/actionRowData';
import * as entityLookupData from '../entry/data/entityLookupData';
import * as entityRowData from '../entry/data/entityRowData';
import { getActionSearchDefinitionByActionType } from './registry/getActionSearchDefinitionByActionType';
import { toLookupKey } from './toLookupKey';

const getEntryErrorText = (entry: ActionHistory): string | undefined => {
  const res = entry.res as ActionProcessorResult<unknown>;

  return isErroredActionResult(res) ? resolveActionResultError(res).errorText : undefined;
};

const buildActionRows = (storyResult: StoryResult<any>, ttl?: number): ActionSearchActionRow[] => {
  const rows: ActionSearchActionRow[] = [];

  // Expands (nested) batch entries into per-action entries with their own results,
  // so actionIndex is the position in the flattened sequence, not the raw history
  const flattenedHistory = filterLogHistoryByActionTypes(storyResult.history, []);

  for (const [actionIndex, entry] of flattenedHistory.entries()) {
    const definition = getActionSearchDefinitionByActionType(entry.act.type);
    if (!definition) {
      continue;
    }

    const extracted = definition.action.extract(entry, storyResult, actionIndex);
    if (!extracted) {
      continue;
    }

    // Fixed fields spread last so extracted fields can never clobber them
    rows.push({
      ...extracted.fields,

      correlation: storyResult.correlation,
      actionIndex,
      actionType: entry.act.type,
      startedAt: entry.startedAt,
      moduleName: storyResult.moduleName,
      executionTimeMs: new Date(entry.finishedAt).getTime() - new Date(entry.startedAt).getTime(),
      error: getEntryErrorText(entry),
      searchText: Object.values(extracted.fields).join(' '),
      linkKey: extracted.linkKey,
      ttl,
    });
  }

  return rows;
};

const getEntityDefinitionsByLinkKey = (actionRows: ActionSearchActionRow[]): Map<string, ActionSearchEntityDefinition> => {
  const entityDefinitionsByLinkKey = new Map<string, ActionSearchEntityDefinition>();

  for (const row of actionRows) {
    if (!row.linkKey) {
      continue;
    }

    const definition = getActionSearchDefinitionByActionType(row.actionType);
    if (definition?.entity) {
      entityDefinitionsByLinkKey.set(row.linkKey, definition.entity);
    }
  }

  return entityDefinitionsByLinkKey;
};

function* askRefoldEntity(
  linkKey: string,
  entityDefinition: ActionSearchEntityDefinition,
  batchRows: ActionSearchActionRow[],
  ttl?: number,
): AskResponse<void> {
  const storedRows = yield* actionRowData.askListAllByLinkKey(linkKey);

  // Union with this batch's rows: the linkKey index may not reflect the upserts above yet
  const rowsByKey = new Map<string, ActionSearchActionRow>();
  for (const row of [...storedRows, ...batchRows.filter((batchRow) => batchRow.linkKey === linkKey)]) {
    rowsByKey.set(`${row.correlation}#${row.actionIndex}`, row);
  }
  const rows = [...rowsByKey.values()];

  const createdAt = rows.map((row) => row.startedAt).sort()[0];

  // Fixed fields spread last so folded fields can never clobber them
  const entityRow: ActionSearchEntityRow = {
    ...entityDefinition.fold(rows),

    linkKey,
    entityType: entityDefinition.entityType,
    createdAt,
    ttl,
  };

  yield* entityRowData.askUpsert(entityRow);

  const buildLookupRow = (localKey: string): ActionSearchLookupRow => ({
    lookupKey: toLookupKey(entityDefinition.entityType, localKey),
    sortValue: `${createdAt}#${linkKey}`,
    linkKey,
    ttl,
  });

  const lookupRows = entityDefinition.lookupKeys(entityRow).map(buildLookupRow);

  yield* askMap(lookupRows, entityLookupData.askUpsert);
}

export function* askUpdateActionSearchFromStoryResult(storyResult: StoryResult<any>, ttl?: number): AskResponse<void> {
  const actionRows = buildActionRows(storyResult, ttl);
  if (actionRows.length === 0) {
    return;
  }

  yield* askMap(actionRows, actionRowData.askUpsert);

  for (const [linkKey, entityDefinition] of getEntityDefinitionsByLinkKey(actionRows)) {
    yield* askRefoldEntity(linkKey, entityDefinition, actionRows, ttl);
  }
}
