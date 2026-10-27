import { CrossModuleOwner } from '../../types';

/**
 * True when two cross-module owners refer to the same owning module identity
 * (module/application/feature/environment). Ignores any resource-name-override
 * key — that's a name, not part of the owner identity.
 */
export const isSameCrossModuleOwner = (a?: CrossModuleOwner, b?: CrossModuleOwner): boolean =>
  a?.module === b?.module && a?.application === b?.application && a?.feature === b?.feature && a?.environment === b?.environment;

export const convertCrossModuleOwnerToGenericResourceNameOverride = <T extends string>(
  owner?: CrossModuleOwner<T>,
): CrossModuleOwner<'resourceNameOverride'> | undefined => {
  if (!owner) {
    return undefined;
  }

  type KeyType = keyof typeof owner;
  const key: KeyType = Array.from(Object.keys(owner)).find(
    (k) => k !== 'module' && k !== 'application' && k !== 'feature' && k !== 'environment',
  ) as any as KeyType;

  const value = owner[key];

  return {
    ...owner,
    resourceNameOverride: value,
  } as any as CrossModuleOwner<'resourceNameOverride'>;
};
