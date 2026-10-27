// Hot-swap support for a module-federation remote: make the NEXT loadRemote of a
// given remote genuinely re-fetch and re-execute its current deployment, instead of
// serving any of the FIVE stale layers a naive force re-registration leaves behind
// (each one found the hard way):
//
//   1. The MF runtime caches (moduleCache, manifest snapshot): force re-registration
//      with a nonce'd entry URL clears them and guarantees a fresh manifest fetch.
//   2. The container global: loadEntryScript short-circuits on `window[globalName]`
//      BEFORE fetching the entry, silently reusing the old container. Cleared by
//      ASSIGNING undefined, not `delete`: the global is a top-level `var` from a
//      classic script, so the window property is non-configurable and delete throws;
//      the runtime's short-circuit is a truthiness check, so undefined is enough.
//   3. The bundler's chunk-loading global (`rspackChunk<name>` / `webpackChunk<name>`):
//      shared by BUILD NAME: every chunk file of every previously loaded copy of the
//      remote pushed its modules into it, and a fresh container drains that array on
//      boot. Chunk ids are stable across builds, so without a reset the new container
//      sees the old build's chunks as already loaded and NEVER fetches its own files:
//      the swap re-executes the OLD code under a new identity. The old container keeps
//      its captured reference to the old array, so it is unaffected.
//   4. The DOM script-tag dedup: both the MF sdk and the chunk loader reuse an existing
//      <script> tag whose src matches (never re-executing it), so every one of the
//      remote's tags (entry AND chunks) is swept.
//   5. The browser HTTP cache of the fixed-name remoteEntry.js: a createScript runtime
//      plugin serves the entry script with the reload nonce on its src, a never-seen
//      URL that no cache layer can answer.
//
// The MF runtime bindings are INJECTED (see FederationRuntimeApi): they must be the
// host bundle's own instance. The bundler aliases '@module-federation/enhanced/runtime'
// onto the runtime it embeds, and importing a second copy here would target the wrong
// (or no) instance. Injection also keeps this package dependency-free.

// Universal function supertype: any concrete MF runtime function is assignable.
type InjectedFunction = (...args: never[]) => unknown;

export type FederationRuntimeApi = {
  getInstance: InjectedFunction;
  registerRemotes: InjectedFunction;
  registerPlugins: InjectedFunction;
};

type FederatedRemote = { name: string; alias?: string; entry: string };

type ResolvedFederationRuntime = {
  getInstance: () => { options: { remotes: (FederatedRemote | { name: string })[] } } | null | undefined;
  registerRemotes: (remotes: FederatedRemote[], options?: { force?: boolean }) => void;
  registerPlugins: (
    plugins: { name: string; createScript: (args: { url: string; remoteInfo?: { name: string } }) => HTMLScriptElement | undefined }[],
  ) => void;
};

// Remotes with a reload in flight: mf container name -> current reload nonce.
// Module scope is safe: quidproquo-web is a module-federation shared singleton, so
// one copy serves the page.
const remoteReloadNonces = new Map<string, number>();

let cacheBustPluginRegistered = false;

const ensureCacheBustPlugin = (registerPlugins: ResolvedFederationRuntime['registerPlugins']): void => {
  if (cacheBustPluginRegistered) {
    return;
  }
  cacheBustPluginRegistered = true;

  registerPlugins([
    {
      name: 'qpq-federated-reload-cache-bust',
      createScript(args: { url: string; remoteInfo?: { name: string } }) {
        const reloadNonce = args.remoteInfo ? remoteReloadNonces.get(args.remoteInfo.name) : undefined;

        if (!reloadNonce) {
          return undefined;
        }

        const script = document.createElement('script');
        script.src = `${args.url.split('?')[0]}?reload=${reloadNonce}`;
        return script;
      },
    },
  ]);
};

/**
 * Prepare a federated remote for a hot-swap: after this call, the next
 * loadRemote() of the remote fetches and executes its CURRENT deployment.
 * `reloadNonce` must be a fresh value per swap (a per-remote counter).
 * Returns false (with a console warning) when the remote is not registered.
 */
export const forceReloadFederatedRemote = (runtimeApi: FederationRuntimeApi, remoteName: string, reloadNonce: number): boolean => {
  const { getInstance, registerRemotes, registerPlugins } = runtimeApi as ResolvedFederationRuntime;

  const remote = getInstance()?.options.remotes.find(
    (candidate) => ('alias' in candidate && candidate.alias === remoteName) || candidate.name === remoteName,
  );

  if (!remote || !('entry' in remote)) {
    console.warn(`[qpq-federated-reload] remote "${remoteName}" not found in MF runtime options - a reload will serve the cached bundle`);
    return false;
  }

  ensureCacheBustPlugin(registerPlugins);
  remoteReloadNonces.set(remote.name, reloadNonce);

  // Layer 2: the container global.
  (globalThis as Record<string, unknown>)[remote.name] = undefined;

  // Layer 3: the bundler chunk-loading globals (rspack and webpack builds).
  (globalThis as Record<string, unknown>)[`rspackChunk${remote.name}`] = undefined;
  (globalThis as Record<string, unknown>)[`webpackChunk${remote.name}`] = undefined;

  const baseEntry = remote.entry.split('?')[0];
  const entryDir = baseEntry.slice(0, baseEntry.lastIndexOf('/'));

  // Layer 4: sweep ALL of this remote's script tags (entry AND chunks).
  document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((scriptTag) => {
    const src = scriptTag.getAttribute('src') ?? '';
    if (src.startsWith(entryDir)) {
      scriptTag.remove();
    }
  });

  // Layer 1: force re-registration with the nonce'd entry.
  registerRemotes([{ ...remote, entry: `${baseEntry}?reload=${reloadNonce}` }], { force: true });

  return true;
};
