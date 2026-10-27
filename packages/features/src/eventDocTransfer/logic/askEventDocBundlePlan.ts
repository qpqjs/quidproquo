import { AskResponse } from 'quidproquo-core';

import { EventDocBundle, EventDocTransferPlanRow, EventDocTransferRegistry } from '../models';
import { askEventDocBundlePlanDoc } from './askEventDocBundlePlanDoc';
import { askEventDocTransferProvideCollection } from './askEventDocTransferProvideCollection';

/** What importing the bundle would do, one row per doc in bundle order. Writes nothing. */
export function* askEventDocBundlePlan(registry: EventDocTransferRegistry, bundle: EventDocBundle): AskResponse<EventDocTransferPlanRow[]> {
  const rows: EventDocTransferPlanRow[] = [];

  for (const doc of bundle.docs) {
    rows.push(yield* askEventDocTransferProvideCollection(registry, doc, askEventDocBundlePlanDoc(doc)));
  }

  return rows;
}
