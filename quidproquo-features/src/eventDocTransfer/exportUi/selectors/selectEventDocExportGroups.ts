import { EventDocManifestGroup } from '../../models';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** The manifest's dependencies (depth > 0) grouped by doc type; the picked roots are listed by selectEventDocExportRoots. */
export const selectEventDocExportGroups = (state: EventDocExportUiState): EventDocManifestGroup[] => {
  const dependencies = state.items.filter((item) => item.depth > 0);

  return dependencies.reduce<EventDocManifestGroup[]>((groups, item) => {
    const group = groups.find((candidate) => candidate.type === item.type);

    if (!group) {
      return [...groups, { type: item.type, items: [item] }];
    }

    group.items.push(item);

    return groups;
  }, []);
};
