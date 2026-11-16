import { EVENT_DOC_LIST_VIEW_KEY_SEPARATOR } from '../constants/eventDocListViewKeySeparator';
import { EVENT_DOC_PRIMARY_VIEW, EVENT_DOC_SUMMARY_VIEW } from './types/EventDocLatestViews';

/**
 * Definition-time guards on a doc type's list views: no declared view takes the built-in `summary` name, each list
 * view names a declared view other than `document`, `summary` is never named (it always is one), and neither a view
 * name nor the type holds the separator the lists store joins them with. Throws at module load, where it is cheapest
 * to diagnose.
 */
export const assertEventDocListViews = (listViewNames: readonly string[], declaredViewNames: readonly string[], type?: string): void => {
  if (declaredViewNames.includes(EVENT_DOC_SUMMARY_VIEW)) {
    throw new Error(
      `'${EVENT_DOC_SUMMARY_VIEW}' is a built-in view name, every event doc has one, folded from the reserved lifecycle events. Remove it from \`views\`, or name the domain-specific projection something else.`,
    );
  }

  listViewNames.forEach((viewName) => {
    if (viewName === EVENT_DOC_SUMMARY_VIEW) {
      throw new Error(`'${EVENT_DOC_SUMMARY_VIEW}' is always a list view, remove it from \`listViews\`.`);
    }

    if (viewName === EVENT_DOC_PRIMARY_VIEW) {
      throw new Error(
        `The '${EVENT_DOC_PRIMARY_VIEW}' view cannot be a list view: its row would be rewritten in full on every event. Declare a small view for the list and name that.`,
      );
    }

    if (!declaredViewNames.includes(viewName)) {
      throw new Error(
        `List view '${viewName}' is not a declared view (declared: ${declaredViewNames.join(', ')}). Add it to every version's \`views\`.`,
      );
    }
  });

  const duplicate = listViewNames.find((viewName, index) => listViewNames.indexOf(viewName) !== index);
  if (duplicate) {
    throw new Error(`List view '${duplicate}' is named twice in \`listViews\`.`);
  }

  const unkeyable = [...declaredViewNames, ...(type ? [type] : [])].find((name) => name.includes(EVENT_DOC_LIST_VIEW_KEY_SEPARATOR));
  if (unkeyable) {
    throw new Error(
      `'${unkeyable}' holds '${EVENT_DOC_LIST_VIEW_KEY_SEPARATOR}', which joins a view name and a doc type into a store key. Rename it without one.`,
    );
  }
};
