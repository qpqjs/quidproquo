/**
 * qpq-log-extension
 *
 * External AWS Lambda extension that ships story-result logs to S3 OFF the
 * function's response path, without ever writing user data to disk.
 *
 *  - The handler POSTs a log to us (cheap, ~1ms) instead of awaiting S3. Per AWS
 *    the response is returned to the caller as soon as the runtime finishes; it
 *    does not wait for this extension.
 *  - We hold the payload in process MEMORY only -- never /tmp or disk, which is
 *    shared across the sandbox and would be a place other code could read user
 *    data from. Memory is isolated and discarded on teardown.
 *  - We ship to S3 with bounded retries + backoff, so transient errors/throttling
 *    don't drop a log.
 *  - We flush on every INVOKE (clears backlog while CPU is hot) and on SHUTDOWN
 *    (last chance before SIGKILL; AWS sends SHUTDOWN even on crash/timeout).
 *
 * Accepted residual: if this process is hard-killed with logs still queued, or S3
 * is down through the whole shutdown window, those logs are lost.
 *
 * Authored in TS, bundled to a single CJS file by scripts/buildLogExtensionLayer.mjs.
 */

import { createServer, IncomingMessage, request, ServerResponse } from 'http';
import { PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';

import { LOG_EXTENSION_PORT } from '../logExtensionPort';

const EXTENSION_NAME = 'qpq-log-extension';
const API_VERSION = '2020-01-01';

// The handler talks to us here. Hardcoded on both ends: see logExtensionPort.ts.
const HTTP_PORT = LOG_EXTENSION_PORT;

// host:port of the Lambda Extensions/Runtime API. Always present in a real Lambda.
const RUNTIME_API = process.env.AWS_LAMBDA_RUNTIME_API;

// Lets the local harness point the S3 client at a fake endpoint.
const S3_ENDPOINT = process.env.QPQ_LOG_EXTENSION_S3_ENDPOINT || undefined;

// Optional artificial delay before each PutObject, for testing slow writes. Off
// (0) by default so production is never slowed.
const TEST_DELAY_MS = parseInt(process.env.QPQ_LOG_EXTENSION_TEST_DELAY_MS || '0', 10);

// Bounded retries so a flush can't run away and stays within the ~2s shutdown
// window. Backoff is attempt^2 * base.
const MAX_SHIP_ATTEMPTS = 3;
const RETRY_BASE_MS = 100;

const log = (...args: unknown[]) => console.log(`[${EXTENSION_NAME}]`, ...args);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

type LogEnvelope = {
  bucketName: string;
  region: string;
  key: string;
  body: string;
  storageClass?: PutObjectCommandInput['StorageClass'];
};

// Reuse one S3 client per region across invocations.
const s3ClientsByRegion = new Map<string, S3Client>();
const getS3Client = (region: string): S3Client => {
  let client = s3ClientsByRegion.get(region);
  if (!client) {
    client = new S3Client({
      region,
      ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT, forcePathStyle: true } : {}),
    });
    s3ClientsByRegion.set(region, client);
  }
  return client;
};

// --- In-memory queue ------------------------------------------------------
// Logs awaiting a successful ship. Keyed by S3 key so a retried log can't be
// queued twice. Held in memory only -- never persisted to disk.
const pending = new Map<string, LogEnvelope>();

const shipEnvelope = async (envelope: LogEnvelope): Promise<boolean> => {
  const client = getS3Client(envelope.region);

  for (let attempt = 1; attempt <= MAX_SHIP_ATTEMPTS; attempt++) {
    try {
      if (TEST_DELAY_MS > 0) await sleep(TEST_DELAY_MS);
      await client.send(
        new PutObjectCommand({
          Bucket: envelope.bucketName,
          Key: envelope.key,
          Body: envelope.body,
          StorageClass: envelope.storageClass ?? 'INTELLIGENT_TIERING',
        }),
      );
      return true;
    } catch (error) {
      if (attempt === MAX_SHIP_ATTEMPTS) {
        log(`failed to ship ${envelope.key} after ${attempt} attempts:`, errorMessage(error));
        return false;
      }
      await sleep(RETRY_BASE_MS * attempt * attempt);
    }
  }
  return false;
};

// Single-flight, but every caller awaits TRUE completion: while a flush runs,
// flush() returns that same in-flight promise (and flags a re-scan), so
// `await flush()` never resolves with a ship still outstanding. That is what
// makes the SHUTDOWN drain safe -- process.exit must not run mid-write.
let activeFlush: Promise<void> | null = null;
let rerun = false;

const runFlushLoop = async (): Promise<void> => {
  // Yield once so `activeFlush = runFlushLoop()` is assigned before this body can
  // reach its finally; otherwise an empty (synchronous) run would null
  // activeFlush before the assignment, leaving a stale resolved promise.
  await Promise.resolve();
  try {
    do {
      rerun = false;
      // Ship the whole snapshot concurrently -- logs are independent and a
      // backlog must drain within the short shutdown window. The queue is
      // bounded by traffic between flushes, so this stays small.
      await Promise.all(
        [...pending.values()].map(async (envelope) => {
          if (await shipEnvelope(envelope)) {
            pending.delete(envelope.key);
            log(`shipped ${envelope.key} -> ${envelope.bucketName}`);
          }
          // On failure leave it queued; the next flush retries it.
        }),
      );
    } while (rerun);
  } finally {
    activeFlush = null;
  }
};

const flush = (): Promise<void> => {
  rerun = true; // ensure an in-flight loop re-scans for anything queued mid-run
  if (!activeFlush) {
    activeFlush = runFlushLoop();
  }
  return activeFlush;
};

// --- Extensions API -------------------------------------------------------

const register = async (): Promise<string> => {
  const res = await fetch(`http://${RUNTIME_API}/${API_VERSION}/extension/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Must match the filename in /opt/extensions.
      'Lambda-Extension-Name': EXTENSION_NAME,
    },
    body: JSON.stringify({ events: ['INVOKE', 'SHUTDOWN'] }),
  });

  if (!res.ok) {
    throw new Error(`register failed: ${res.status} ${await res.text()}`);
  }

  const id = res.headers.get('lambda-extension-identifier');
  if (!id) {
    throw new Error('register response missing Lambda-Extension-Identifier header');
  }

  log('registered', id);
  return id;
};

const nextEvent = (extensionId: string): Promise<{ eventType?: string }> =>
  // Long-poll. Resolves when the platform has the next INVOKE/SHUTDOWN event, which can
  // be arbitrarily far away. Plain http.request, NOT fetch: undici's default 300s
  // headersTimeout aborts any poll that blocks past 5 minutes (i.e. during every
  // invocation that runs longer than that), crashing this extension and, with it, the
  // whole sandbox (REPORT ... Error Type: Extension.Crash). http.request has no
  // default timeout, which is exactly what an indefinite long-poll needs.
  new Promise((resolve, reject) => {
    const [host, port] = (RUNTIME_API || '').split(':');

    const req = request(
      {
        host,
        port,
        path: `/${API_VERSION}/extension/event/next`,
        method: 'GET',
        headers: { 'Lambda-Extension-Identifier': extensionId },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('error', reject);
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          const statusCode = res.statusCode || 0;

          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`event/next failed: ${statusCode} ${body}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.on('error', reject);
    req.end();
  });

// --- Local HTTP server (handler -> extension) -----------------------------

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const startHttpServer = (): Promise<void> =>
  new Promise((resolve) => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      if (req.method === 'POST' && req.url === '/log') {
        try {
          const envelope = JSON.parse(await readBody(req)) as LogEnvelope;
          // Queue in memory and ack immediately; ship in the background.
          pending.set(envelope.key, envelope);
          res.writeHead(202, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ queued: true }));
          void flush();
        } catch (error) {
          log('bad /log payload:', errorMessage(error));
          res.writeHead(400);
          res.end();
        }
        return;
      }

      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, pending: pending.size }));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(HTTP_PORT, '127.0.0.1', () => {
      log(`listening on 127.0.0.1:${HTTP_PORT}`);
      resolve();
    });
  });

// --- Main loop ------------------------------------------------------------

const main = async (): Promise<void> => {
  if (!RUNTIME_API) {
    throw new Error('AWS_LAMBDA_RUNTIME_API not set - not running inside a Lambda execution environment');
  }

  await startHttpServer();
  const extensionId = await register();

  while (true) {
    const event = await nextEvent(extensionId);

    if (event?.eventType === 'SHUTDOWN') {
      log('shutdown received, flushing', pending.size, 'queued log(s)');
      await flush();
      log('flush complete, exiting');
      // The HTTP server keeps the event loop alive; exit explicitly.
      process.exit(0);
    }

    // INVOKE: flush the queue while we have CPU. Adds to billed duration, not to
    // the caller's response latency.
    await flush();
  }
};

main().catch((error) => {
  log('fatal:', errorMessage(error));
  process.exit(1);
});
