import {
  defineCryptoKey,
  defineEmailReceiver,
  defineEmailSender,
  defineEventBus,
  defineKeyValueStore,
  defineParameter,
  defineQueue,
  defineRoute,
  defineSecret,
  defineSigningKey,
  defineStorageDrive,
  QPQConfig,
  QpqFunctionRuntime,
} from 'quidproquo';
import { defineEventDoc } from 'quidproquo-features';

import { z } from 'zod/v4';
import {
  SMOKE_PROBE_DRIVE,
  SMOKE_PROBE_SIGNING_KEY,
  SMOKE_PROBE_STORE,
} from '@qpqjs/constants';
import {
  SmokeProbeRecord,
  SmokeRunStartedSchema,
  SmokeRunWithSummarySchema,
} from '@qpqjs/test-models';

import { SMOKE_RUNS_STORE } from '../constants/SMOKE_RUNS_STORE';
import {
  SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE,
  SMOKE_EVENT_DOC_APPEND_QUEUE,
  SMOKE_EVENT_DOC_BASE_PATH,
} from '../constants/smokeEventDoc';
import {
  SMOKE_CRYPTO_KEY,
  SMOKE_EMAIL_RECEIVER,
  SMOKE_ENCRYPTED_PROBE_DRIVE,
  SMOKE_ENCRYPTED_PROBE_STORE,
  SMOKE_FILE_EVENT_DRIVE,
  SMOKE_PROBE_EVENT_BUS,
  SMOKE_PROBE_EVENT_QUEUE,
  SMOKE_PROBE_EVENT_TYPE,
  SMOKE_PROBE_PARAMETER,
  SMOKE_PROBE_PARAMETER_VALUE,
  SMOKE_PROBE_SECRET,
  SMOKE_SCOPED_PROBE_DRIVE,
  SMOKE_SCOPED_PROBE_STORE,
  SMOKE_STREAM_PROBE_STORE,
} from '../constants/smokeProbe';
import {
  SMOKE_RUN_QUEUE,
  SMOKE_TEST_REQUESTED_MESSAGE_TYPE,
} from '../constants/smokeRunQueue';
import { smokeProbeDocDefinition } from '../eventDoc/smokeProbeDocDefinition';

// Everything the smoke feature needs: the run store, the queue runs execute
// on, and the two routes. Runtimes are located relative to this file, so the
// module can move as a unit.
//
// The routes look public (no user directory, no api keys) but carry a
// per-runtime action processor override that swaps the route auth decode for
// the GitHub OIDC validator - so ONLY a GitHub Actions run of our repo,
// holding an OIDC token with the qpq-smoke audience and matching pinned
// claims, gets past the preamble. Everything else 401s, tokenless included.
export const defineSmoke = (): QPQConfig => {
  const githubOidcAuth: QpqFunctionRuntime[] = [
    {
      basePath: __dirname,
      relativePath: '../processors/github/getGithubOidcAuthProcessors',
      functionName: 'getGithubOidcAuthProcessors',
    },
  ];

  const onSmokeFileEvent: QpqFunctionRuntime = {
    basePath: __dirname,
    relativePath: '../storageDrive/onSmokeFileEvent',
    functionName: 'onSmokeFileEvent',
  };

  return [
    // One record per run, keyed by runId; the queue workers each write their
    // own test's entry as it completes and the GET route polls it.
    defineKeyValueStore(SMOKE_RUNS_STORE, 'runId'),

    // One message per test per run. Not FIFO and no concurrency cap, so the
    // tests of a run fan out and execute in parallel.
    defineQueue(SMOKE_RUN_QUEUE, {
      [SMOKE_TEST_REQUESTED_MESSAGE_TYPE]: {
        basePath: __dirname,
        relativePath: '../queue/onSmokeTestRequested',
        functionName: 'onSmokeTestRequested',
      },
    }),

    // Throwaway probe resources, one per kind of owned resource the tag-based
    // IAM grants cover. The store's `category` index is what the KVS test
    // queries through, proving the `table/*/index/*` half of the grant.
    defineKeyValueStore<SmokeProbeRecord>(SMOKE_PROBE_STORE, 'probeId', [], {
      indexes: ['category'],
    }),
    defineParameter(SMOKE_PROBE_PARAMETER, {
      value: SMOKE_PROBE_PARAMETER_VALUE,
    }),
    defineSecret(SMOKE_PROBE_SECRET),
    defineStorageDrive(SMOKE_PROBE_DRIVE),
    // An owned RSA signing key: kms:Sign + kms:GetPublicKey through the
    // alias-conditioned grant. testa declares the same key foreign (see
    // defineCrossServiceProbe) for the cross-service verify test.
    defineSigningKey(SMOKE_PROBE_SIGNING_KEY),

    // Scoped probe resources: the scope gate in both directions (a scoped
    // resource refuses an unscoped call, an unscoped one refuses a scope) and
    // partition isolation between two scopes.
    defineKeyValueStore<SmokeProbeRecord>(
      SMOKE_SCOPED_PROBE_STORE,
      'probeId',
      [],
      { indexes: ['category'], scoped: true }
    ),
    defineStorageDrive(SMOKE_SCOPED_PROBE_DRIVE, {
      scoped: true,
      onEvent: { create: onSmokeFileEvent, delete: onSmokeFileEvent },
    }),

    // File event test path: a write or delete on either drive fires the
    // handler, which writes a marker into the probe store; the test polls for
    // it. The scoped drive's events must arrive with the scope split off.
    defineStorageDrive(SMOKE_FILE_EVENT_DRIVE, {
      onEvent: { create: onSmokeFileEvent, delete: onSmokeFileEvent },
    }),

    // Kvs stream test path: a change on this scoped store streams to the
    // handler, which writes a marker into the probe store; the test polls for
    // it. The record must carry the scope as its own field with a raw key, and
    // the category index's hidden copy must not reach the handler.
    defineKeyValueStore<SmokeProbeRecord>(
      SMOKE_STREAM_PROBE_STORE,
      'probeId',
      [],
      {
        indexes: ['category'],
        scoped: true,
        onStream: {
          runtime: {
            basePath: __dirname,
            relativePath: '../kvsStream/onSmokeStreamRecord',
            functionName: 'onSmokeStreamRecord',
          },
        },
      }
    ),

    // Encrypted probe resources: a drive and a store encrypted with an owned
    // crypto key, so the test proves the role's KMS grant covers data at rest.
    defineCryptoKey(SMOKE_CRYPTO_KEY),
    defineKeyValueStore<SmokeProbeRecord>(
      SMOKE_ENCRYPTED_PROBE_STORE,
      'probeId',
      [],
      { cryptoKeyName: SMOKE_CRYPTO_KEY }
    ),
    defineStorageDrive(SMOKE_ENCRYPTED_PROBE_DRIVE, {
      cryptoKeyName: SMOKE_CRYPTO_KEY,
    }),

    // Inbound email test path: the test sends to its own receiving domain, the
    // receiver hands the parsed message to onSmokeEmailReceived, which writes a
    // marker into the probe store, and the test polls for it. The sender is what
    // lets the test send; the receiving domain is a verified identity, so the
    // SES sandbox allows it.
    defineEmailSender(),
    defineEmailReceiver(SMOKE_EMAIL_RECEIVER, {
      onEmail: {
        basePath: __dirname,
        relativePath: '../email/onSmokeEmailReceived',
        functionName: 'onSmokeEmailReceived',
      },
    }),

    // Event bus test path: publish to the bus, the subscribed queue's entry
    // writes a marker into the probe store, the test polls for it.
    defineEventBus(SMOKE_PROBE_EVENT_BUS),
    defineQueue(
      SMOKE_PROBE_EVENT_QUEUE,
      {
        [SMOKE_PROBE_EVENT_TYPE]: {
          basePath: __dirname,
          relativePath: '../queue/onSmokeProbeEvent',
          functionName: 'onSmokeProbeEvent',
        },
      },
      { eventBusSubscriptions: [SMOKE_PROBE_EVENT_BUS] }
    ),

    // The event-doc probe collection: a full registered collection (stores, stream
    // projector, dynamic functions, routes) so the smoke tests exercise event docs the
    // way a real service does. NOTE the routes mount with no auth - the test service
    // has no user directory - so the collection is world-writable; it holds nothing
    // but throwaway probe docs. The queue fans a test's writers out one invocation
    // each, so their appends race across lambdas.
    defineEventDoc(
      smokeProbeDocDefinition,
      {
        basePath: __dirname,
        relativePath: '../eventDoc/smokeProbeDocDefinition',
        functionName: 'smokeProbeDocDefinition',
      },
      { basePath: SMOKE_EVENT_DOC_BASE_PATH }
    ),
    // A writer that loses the slot race past the append retry cap fails its message; a
    // quick redelivery lets it land instead of vanishing, as a production queue should.
    defineQueue(
      SMOKE_EVENT_DOC_APPEND_QUEUE,
      {
        [SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE]: {
          basePath: __dirname,
          relativePath: '../queue/onSmokeEventDocAppend',
          functionName: 'onSmokeEventDocAppend',
        },
      },
      { maxTries: 3, ttRetryInSeconds: 10 }
    ),

    // The zod models double as the routes' published contract, flattened to
    // JSON Schema here for the OpenAPI document at /v1/docs.
    defineRoute(
      'POST',
      '/smoke/run',
      {
        basePath: __dirname,
        relativePath: '../controller/askRunSmokeTests',
        functionName: 'askRunSmokeTests',
        actionProcessors: githubOidcAuth,
      },
      {
        schema: {
          summary: 'Start a smoke run',
          description:
            'Queues every registered smoke test and returns the run id to poll. Requires a GitHub Actions OIDC token for this repo.',
          tags: ['smoke'],
          responseJsonSchema: z.toJSONSchema(SmokeRunStartedSchema),
        },
      }
    ),

    defineRoute(
      'GET',
      '/smoke/run/{runId}',
      {
        basePath: __dirname,
        relativePath: '../controller/askGetSmokeRun',
        functionName: 'askGetSmokeRun',
        actionProcessors: githubOidcAuth,
      },
      {
        schema: {
          summary: 'Get a smoke run',
          description:
            'The stored run plus pass/fail counts. Poll until status leaves running.',
          tags: ['smoke'],
          responseJsonSchema: z.toJSONSchema(SmokeRunWithSummarySchema),
        },
      }
    ),
  ];
};
