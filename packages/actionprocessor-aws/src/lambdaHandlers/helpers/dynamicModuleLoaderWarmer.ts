/**
 * Placeholder hook run on an SNS warmer ping. Intended to pre-fetch federated
 * dynamic modules so the first real invoke does not pay the load cost; nothing
 * is wired up yet, so it is a no-op.
 */
export const dynamicModuleLoaderWarmer = async (): Promise<void> => {
  // NOOP
};
