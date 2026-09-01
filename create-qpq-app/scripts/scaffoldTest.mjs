// End-to-end rot-guard for create-qpq-app: scaffold BOTH language flavours,
// point them at this checkout's quidproquo packages, install, build, boot the
// dev server and hit the health endpoint. Run it after template or step
// changes (and in CI):
//
//   npm run build -w create-qpq-app && npm run scaffold-test -w create-qpq-app
//
// The file: ref swap mirrors what CI must do pre-publish: the scaffolded
// pins point at registry versions that may not exist yet.
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '..');
const binPath = path.join(packageRoot, 'lib', 'commonjs', 'bin', 'createQpqApp.js');

const HEALTH_URL = 'http://localhost:8080/api/shell/v1/health';
const DEV_SERVER_PORTS = [8080, 8888, 3001];
const DEV_SERVER_BUNDLE_PATH = path.join('dist', 'qpq', 'dev-server', 'main.js');
const BOOT_TIMEOUT_MS = 180_000;

const log = (message) => console.log(`\x1b[36m[scaffold]\x1b[0m ${message}`);

const run = (command, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: true });
    child.on('error', reject);
    child.on('exit', (code) => (code ? reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)) : resolve()));
  });

// Kill any listener on the dev ports that is running a qpq dev-server bundle
// (leftovers from an aborted run). Anything else on the ports is fatal: it
// isn't ours to kill, and the boot would fail confusingly.
const clearDevServerPorts = () => {
  for (const port of DEV_SERVER_PORTS) {
    let pids = [];
    try {
      pids = execSync(`lsof -t -iTCP:${port} -sTCP:LISTEN`, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .split('\n')
        .map((line) => Number(line.trim()))
        .filter(Boolean);
    } catch {
      continue; // nothing listening
    }

    for (const pid of pids) {
      let command = '';
      try {
        command = execSync(`ps -p ${pid} -o command=`).toString().trim();
      } catch {
        continue;
      }
      if (command.includes(DEV_SERVER_BUNDLE_PATH)) {
        log(`killing stale dev server on port ${port} (pid ${pid})`);
        process.kill(pid);
      } else {
        throw new Error(`Port ${port} is held by an unrelated process (pid ${pid}: ${command}). Free it and re-run.`);
      }
    }
  }
};

// The scaffolded app pins registry versions; point every quidproquo dep at
// this checkout instead so the scaffold test exercises unpublished code.
const useLocalQuidproquoRefs = (appDir) => {
  const packageJsonPath = path.join(appDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  for (const block of [packageJson.dependencies, packageJson.devDependencies]) {
    for (const name of Object.keys(block ?? {})) {
      if (name.startsWith('quidproquo')) {
        block[name] = `file:${path.join(repoRoot, name)}`;
      }
    }
  }
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
};

const waitForHealthy = async (deadlineMs) => {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      const response = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(2000) });
      const body = await response.json();
      if (body.status === 'healthy') return body;
    } catch {
      // not up yet
    }
  }
  throw new Error(`dev server did not report healthy within ${deadlineMs / 1000}s`);
};

const scaffoldTestLanguage = async (workDir, language) => {
  const appName = `scaffold${language === 'javascript' ? 'js' : 'ts'}`;
  const appDir = path.join(workDir, appName);

  log(`--- ${language}: scaffolding ${appName}`);
  await run('node', [binPath, appName, '--language', language, '--no-install', '--no-git'], workDir);

  useLocalQuidproquoRefs(appDir);

  log(`--- ${language}: npm install`);
  await run('npm', ['install', '--no-audit', '--no-fund'], appDir);

  log(`--- ${language}: npm run build`);
  await run('npm', ['run', 'build'], appDir);

  log(`--- ${language}: booting dev server`);
  clearDevServerPorts();
  // qpq go:dev:api, not the `dev` script (qpq go:dev): the scaffold test only
  // asserts the API health endpoint, and the views dev servers would add
  // minutes of Rspack compile plus a fleet of ports this script doesn't sweep.
  const devServer = spawn('npx', ['--no-install', 'qpq', 'go:dev:api'], { cwd: appDir, shell: true, detached: true, stdio: 'ignore' });

  try {
    const health = await waitForHealthy(BOOT_TIMEOUT_MS);
    log(`--- ${language}: healthy: ${JSON.stringify(health)}`);
  } finally {
    try {
      process.kill(-devServer.pid, 'SIGTERM');
    } catch {
      // already gone
    }
    clearDevServerPorts();
  }
};

const main = async () => {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < 24) {
    throw new Error(`scaffold test needs node >= 24 (you are on ${process.versions.node})`);
  }
  if (!fs.existsSync(binPath)) {
    throw new Error(`${binPath} missing. Build create-qpq-app first.`);
  }

  log('refreshing template snapshot');
  await run('node', [path.join(packageRoot, 'scripts', 'snapshotTemplate.mjs')], packageRoot);

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cqa-scaffold-'));
  log(`working in ${workDir}`);

  try {
    await scaffoldTestLanguage(workDir, 'typescript');
    await scaffoldTestLanguage(workDir, 'javascript');
  } catch (error) {
    console.error(`\n[scaffold] FAILED: ${error.message}`);
    console.error(`[scaffold] scaffolds kept for inspection: ${workDir}`);
    process.exit(1);
  }

  fs.rmSync(workDir, { recursive: true, force: true });
  log('PASS: both languages scaffold, build and serve.');
};

main();
