import { SmokeSuite } from '../harness/types/SmokeSuite';
import { emailReceiveSmokeSuite } from './emailReceive/emailReceiveSmokeSuite';
import { encryptedResourcesSmokeSuite } from './encryptedResources/encryptedResourcesSmokeSuite';
import { eventBusSmokeSuite } from './eventBus/eventBusSmokeSuite';
import { eventDocSmokeSuite } from './eventDoc/eventDocSmokeSuite';
import { keyValueStoreSmokeSuite } from './keyValueStore/keyValueStoreSmokeSuite';
import { keyValueStoreStreamSmokeSuite } from './keyValueStoreStream/keyValueStoreStreamSmokeSuite';
import { noopSmokeSuite } from './noop/noopSmokeSuite';
import { openApiSmokeSuite } from './openApi/openApiSmokeSuite';
import { parameterSmokeSuite } from './parameter/parameterSmokeSuite';
import { scheduleSmokeSuite } from './schedule/scheduleSmokeSuite';
import { scopedKeyValueStoreSmokeSuite } from './scopedKeyValueStore/scopedKeyValueStoreSmokeSuite';
import { secretSmokeSuite } from './secret/secretSmokeSuite';
import { signingKeySmokeSuite } from './signingKey/signingKeySmokeSuite';
import { storageDriveSmokeSuite } from './storageDrive/storageDriveSmokeSuite';
import { storageDriveEventSmokeSuite } from './storageDriveEvent/storageDriveEventSmokeSuite';

/**
 * Every suite a smoke run executes. Adding one: a folder under suites/
 * exporting a SmokeSuite, and a line here. A suite with a cross-service half
 * also has a folder of the same name under testa's smoke/suites.
 *
 * Every test runs in parallel on its own queue message, so none may depend on
 * another having finished. A test's name is the key its queue message carries
 * and must be unique across suites; its id in the run record is its position
 * across this list, so append rather than reorder where possible.
 */
export const smokeSuites: SmokeSuite[] = [
  noopSmokeSuite,
  keyValueStoreSmokeSuite,
  parameterSmokeSuite,
  secretSmokeSuite,
  storageDriveSmokeSuite,
  eventBusSmokeSuite,
  scheduleSmokeSuite,
  openApiSmokeSuite,
  eventDocSmokeSuite,
  signingKeySmokeSuite,
  storageDriveEventSmokeSuite,
  scopedKeyValueStoreSmokeSuite,
  keyValueStoreStreamSmokeSuite,
  encryptedResourcesSmokeSuite,
  emailReceiveSmokeSuite,
];
