// The question flow for `qpq clear-resources`: enumerate every service's OWNED
// data resources (storage drives -> buckets, key value stores -> tables) from
// its live qpq config, multi-select which to empty, then type the deploy
// target back to confirm - emptying deletes stored data, so a y/n prompt
// isn't enough friction. Owned-only so a cross-module ref (e.g. a membership
// table every service declares against one owner) appears exactly once, on
// the service that owns it.
import { qpqCoreUtils } from 'quidproquo-core';

import { getServiceNames } from './discovery';
import { promptCheckbox, promptSelect, promptText } from './prompts';
import { loadServiceQpqConfig } from './qpqConfigs';
import { getDeployTargetLabel } from './getDeployTargetLabel';

export type ClearableResourceKind = 'storageDrive' | 'keyValueStore';

export type ClearableResource = {
  service: string;
  kind: ClearableResourceKind;
  // The config-level resource name (e.g. 'templateTestAssets', 'userTenantLinks');
  // the platform driver resolves it to the concrete runtime name (bucket/table).
  resourceName: string;
};

export type ClearResourcesPlan =
  | { kind: 'cancelled' }
  // Empty (not destroy) the selected resources' stored data.
  | { kind: 'resources'; appName: string; resources: ClearableResource[] };

// Every owned data resource across the app's services, in service order.
export const getClearableResources = (appName: string): ClearableResource[] => {
  const resources: ClearableResource[] = [];

  for (const service of getServiceNames(appName)) {
    const qpqConfig = loadServiceQpqConfig(appName, service);

    for (const drive of qpqCoreUtils.getOwnedStorageDrives(qpqConfig)) {
      resources.push({ service, kind: 'storageDrive', resourceName: drive.storageDrive });
    }

    for (const store of qpqCoreUtils.getOwnedKeyValueStores(qpqConfig)) {
      resources.push({ service, kind: 'keyValueStore', resourceName: store.keyValueStoreName });
    }
  }

  return resources;
};

const BY_SERVICE = 'By service — empty everything the selected services own';
const BY_RESOURCE = 'By resource — pick individual buckets/tables';

// Service mode: pick services, take every resource each one owns.
const pickByService = async (clearable: ClearableResource[]): Promise<ClearableResource[]> => {
  const services = [...new Set(clearable.map((resource) => resource.service))];

  const countFor = (service: string) => clearable.filter((resource) => resource.service === service).length;

  const picked = await promptCheckbox(
    'Select services to EMPTY (every bucket/table the service owns)',
    services.map((service) => ({ name: `${service} (${countFor(service)} resources)`, value: service })),
  );

  return clearable.filter((resource) => picked.includes(resource.service));
};

// Resource mode: pick individual buckets/tables.
const pickByResource = (clearable: ClearableResource[]): Promise<ClearableResource[]> =>
  promptCheckbox(
    'Select resources to EMPTY (all stored data will be deleted)',
    clearable.map((resource) => ({
      name: `${resource.service} — ${resource.resourceName} (${resource.kind === 'storageDrive' ? 'bucket' : 'table'})`,
      value: resource,
    })),
  );

export const promptClearResourcesPlan = async (appName: string): Promise<ClearResourcesPlan> => {
  const deployInfo = getDeployTargetLabel();

  const clearable = getClearableResources(appName);

  if (clearable.length === 0) {
    console.log('No storage drives or key value stores found in this app.');
    return { kind: 'cancelled' };
  }

  const mode = await promptSelect('How do you want to select what to empty?', [BY_SERVICE, BY_RESOURCE]);

  const resources = mode === BY_SERVICE ? await pickByService(clearable) : await pickByResource(clearable);

  if (resources.length === 0) {
    console.log('Nothing selected. Exiting!');
    return { kind: 'cancelled' };
  }

  console.log(`\nThis will EMPTY (delete all stored data from) ${resources.length} resource(s) in [${deployInfo}]:`);
  for (const resource of resources) {
    console.log(`  ${resource.service} — ${resource.resourceName} (${resource.kind === 'storageDrive' ? 'bucket' : 'table'})`);
  }

  const confirmation = await promptText(`Type '${deployInfo}' to confirm`);

  if (confirmation !== deployInfo) {
    console.log('Confirmation did not match. Exiting!');
    return { kind: 'cancelled' };
  }

  return { kind: 'resources', appName, resources };
};
