import {
  askFileDelete,
  askFileReadTextContents,
  askFileWriteTextContents,
  askKeyValueStoreDelete,
  askKeyValueStoreGet,
  askKeyValueStoreUpsert,
  askNewGuid,
  AskResponse,
} from 'quidproquo';

import { SmokeProbeRecord } from '@qpqjs/test-models';

import {
  SMOKE_ENCRYPTED_PROBE_DRIVE,
  SMOKE_ENCRYPTED_PROBE_STORE,
} from '../../constants/smokeProbe';
import { askSmokeAssert } from '../askSmokeAssert';

// A drive and a store encrypted with a defineCryptoKey. Deployed, every write
// needs kms:GenerateDataKey and every read kms:Decrypt on that key through
// the alias-conditioned grant, so a plain round trip on each is the proof.
// Locally there is no encryption at rest and this is a plain round trip.
export function* askRunEncryptedResourcesTest(): AskResponse<void> {
  const probeId = yield* askNewGuid();

  const record: SmokeProbeRecord = { probeId, category: 'encrypted', value: 1 };
  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(
    SMOKE_ENCRYPTED_PROBE_STORE,
    record
  );

  const written = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_ENCRYPTED_PROBE_STORE,
    probeId
  );
  yield* askSmokeAssert(
    written?.value === 1,
    'get after upsert on the encrypted store did not return the record'
  );

  yield* askKeyValueStoreDelete(SMOKE_ENCRYPTED_PROBE_STORE, probeId);

  const filepath = `encrypted/${probeId}.txt`;
  const contents = `encrypted smoke probe ${probeId}`;

  yield* askFileWriteTextContents(
    SMOKE_ENCRYPTED_PROBE_DRIVE,
    filepath,
    contents
  );

  const readBack = yield* askFileReadTextContents(
    SMOKE_ENCRYPTED_PROBE_DRIVE,
    filepath
  );
  yield* askSmokeAssert(
    readBack === contents,
    'file on the encrypted drive did not read back as written'
  );

  yield* askFileDelete(SMOKE_ENCRYPTED_PROBE_DRIVE, [filepath]);
}
