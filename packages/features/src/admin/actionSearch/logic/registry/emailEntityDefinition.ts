import { EmailDeliveryStatus } from 'quidproquo-webserver';

import { ActionSearchActionRow } from '../../domain/ActionSearchActionRow';
import { ActionSearchEntityDefinition } from '../../domain/ActionSearchEntityDefinition';
import { ActionSearchEntityRow } from '../../domain/ActionSearchEntityRow';
import { ActionSearchFieldType } from '../../domain/ActionSearchFieldType';
import { ActionSearchFilterOperator } from '../../domain/ActionSearchFilterOperator';

// Higher rank wins the fold: delivery progress beats sent, terminal states beat
// everything, so arrival order never matters
const emailDeliveryStatusRank: Record<string, number> = {
  [EmailDeliveryStatus.sent]: 1,
  [EmailDeliveryStatus.processed]: 2,
  [EmailDeliveryStatus.deferred]: 3,
  [EmailDeliveryStatus.delivered]: 4,
  [EmailDeliveryStatus.block]: 5,
  [EmailDeliveryStatus.bounce]: 6,
  [EmailDeliveryStatus.dropped]: 7,
};

const getStatusRank = (row: ActionSearchActionRow): number =>
  typeof row.deliveryStatus === 'string' ? (emailDeliveryStatusRank[row.deliveryStatus] ?? 0) : 0;

const compareRowsForFold = (a: ActionSearchActionRow, b: ActionSearchActionRow): number =>
  a.startedAt.localeCompare(b.startedAt) || a.correlation.localeCompare(b.correlation) || a.actionIndex - b.actionIndex;

const isFoldableScalar = (value: unknown): value is string | number | boolean =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

const foldEmailEntity = (rows: ActionSearchActionRow[]): Record<string, string | number | boolean> => {
  // Deterministic order regardless of arrival/query order
  const sorted = [...rows].sort(compareRowsForFold);

  const folded: Record<string, string | number | boolean> = {};

  // On equal rank the later row wins, so repeated events (e.g. deferred retries) keep the latest reason
  let statusRow: ActionSearchActionRow | undefined;

  for (const row of sorted) {
    for (const fieldName of ['from', 'to', 'cc', 'subject', 'messageId']) {
      const value = row[fieldName];
      if (folded[fieldName] === undefined && isFoldableScalar(value)) {
        folded[fieldName] = value;
      }
    }

    if (getStatusRank(row) >= (statusRow ? getStatusRank(statusRow) : 0) && getStatusRank(row) > 0) {
      statusRow = row;
    }

    const currentSentAt = typeof folded.sentAt === 'string' ? folded.sentAt : undefined;
    if (currentSentAt === undefined || row.startedAt < currentSentAt) {
      folded.sentAt = row.startedAt;
    }
  }

  if (statusRow) {
    folded.deliveryStatus = statusRow.deliveryStatus as string;

    if (typeof statusRow.reason === 'string') {
      folded.reason = statusRow.reason;
    }
  }

  return folded;
};

const getEmailLookupKeys = (entity: ActionSearchEntityRow): string[] => {
  const addresses = [entity.to, entity.cc]
    .filter((value): value is string => typeof value === 'string')
    .flatMap((joined) => joined.split(','))
    .map((address) => address.trim())
    .filter((address) => !!address);

  return [...new Set(addresses)].map((address) => `recipient#${address}`);
};

export const emailEntityDefinition: ActionSearchEntityDefinition = {
  entityType: 'email',
  viewName: 'Emails',
  fields: [
    { name: 'to', label: 'To', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
    { name: 'recipient', label: 'Recipient', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Exact, hasLookup: true },
    { name: 'subject', label: 'Subject', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
    { name: 'from', label: 'From', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Equals },
    {
      name: 'deliveryStatus',
      label: 'Status',
      type: ActionSearchFieldType.Enum,
      operator: ActionSearchFilterOperator.Equals,
      enumValues: Object.values(EmailDeliveryStatus),
    },
    { name: 'reason', label: 'Reason', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
  ],
  fold: foldEmailEntity,
  lookupKeys: getEmailLookupKeys,
};
