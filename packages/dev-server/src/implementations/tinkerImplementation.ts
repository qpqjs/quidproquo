import { createRuntime, QPQConfig, qpqCoreUtils, QpqRuntimeType, Story, StoryResult } from 'quidproquo-core';
import * as qpqCore from 'quidproquo-core';
import * as qpqWebserver from 'quidproquo-webserver';

import { randomUUID } from 'crypto';
import path from 'path';
import * as repl from 'repl';
import * as util from 'util';
import * as vm from 'vm';

import { getDevServerActionProcessors } from '../actionProcessor';
import { requestDevServerShutdown } from '../logic';
import { ResolvedDevServerConfig, TinkerInterface, TinkerOptions } from '../types';
import { getDevServerLogger } from './logger';

const getDateNow = () => new Date().toISOString();

const getDynamicModuleLoader = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return async (runtime: any): Promise<any> => devServerConfig.dynamicModuleLoader(serviceName, runtime);
};

export const createTinkerInterface = (devServerConfig: ResolvedDevServerConfig, tinkerOptions?: TinkerOptions): TinkerInterface => {
  const availableServices = devServerConfig.qpqConfigs.map((config) => qpqCoreUtils.getApplicationModuleName(config));

  let currentServiceName = tinkerOptions?.initialService || availableServices[0];

  const getServiceConfig = (): QPQConfig => {
    const config = devServerConfig.qpqConfigs.find((c) => qpqCoreUtils.getApplicationModuleName(c) === currentServiceName);
    if (!config) {
      throw new Error(`Service '${currentServiceName}' not found`);
    }
    return config;
  };

  const tinkerInterface: TinkerInterface = {
    run: async <TArgs extends Array<any>, TReturn>(story: Story<TArgs, TReturn>, args?: TArgs): Promise<StoryResult<TArgs, TReturn>> => {
      const qpqConfig = getServiceConfig();
      const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
      const dynamicModuleLoader = getDynamicModuleLoader(qpqConfig, devServerConfig);

      const storySession = {
        depth: 0,
        context: {},
      };

      const logger = getDevServerLogger(qpqConfig, devServerConfig, storySession);

      const resolveStory = createRuntime(
        qpqConfig,
        storySession,
        async () => ({
          ...(await getDevServerActionProcessors(qpqConfig, dynamicModuleLoader, devServerConfig)),
        }),
        getDateNow,
        logger,
        `${serviceName}::tinker-${randomUUID()}`,
        QpqRuntimeType.SERVICE_FUNCTION_EXE,
        dynamicModuleLoader,
        undefined,
        ['tinker'],
      );

      try {
        const result = await resolveStory<TArgs>(story, args || ([] as unknown as TArgs));

        await logger.waitToFinishWriting();

        return result;
      } catch (error) {
        await logger.waitToFinishWriting();
        throw error;
      }
    },

    switchService: (serviceName: string) => {
      if (!availableServices.includes(serviceName)) {
        throw new Error(`Service '${serviceName}' not found. Available services: ${availableServices.join(', ')}`);
      }
      currentServiceName = serviceName;
      console.log(`Switched to service: ${serviceName}`);
    },

    getCurrentService: () => currentServiceName,

    getServices: () => availableServices,

    getServiceConfig,

    startRepl: () => {
      console.log(`\n🔧 QPQ Tinker - Interactive Development Environment`);
      console.log(`📦 Current service: ${currentServiceName}`);
      console.log(`📚 Available services: ${availableServices.join(', ')}\n`);
      console.log(`Commands:`);
      console.log(`  .editor or .e  - Enter multiline editor mode`);
      console.log(`  .help         - Show all commands`);
      console.log(`  .exit         - Exit tinker\n`);
      console.log(`Usage (automatically runs in QPQ context):`);
      console.log(`  yield* askDateNow()                        - Direct generator code`);
      console.log(`  yield* askExecuteServiceFunction(...)      - Call service functions`);
      console.log(`  requireLocal('./logic/utils')              - Import regular modules`);
      console.log(`  await importLocal('./entry/queueEvent/x')  - Import QPQ entry points`);
      console.log(`  tinker.switchService('serviceName')        - Change service context`);
      console.log(`  tinker.getServices()                       - List services\n`);
      console.log(`Tip: Code is automatically wrapped in a generator function and executed via run()\n`);

      const replServer = repl.start({
        prompt: `qpq:${currentServiceName}> `,
        eval: async (cmd, context, filename, callback) => {
          try {
            // Check if this looks like a direct command (switchService, etc) or a simple expression
            const trimmedCmd = cmd.trim();

            // If it's a tinker command or simple expression, run it directly
            if (trimmedCmd.startsWith('tinker.') || trimmedCmd === '') {
              const result = await vm.runInContext(`(async () => { return ${cmd} })()`, context);
              callback(null, result);
            } else {
              // Wrap in generator and run through tinker.run()
              const storyWrapper = `
                (async () => {
                  const story = async function* () {
                    ${cmd}
                  };
                  return await tinker.run(story);
                })()
              `;
              const result = await vm.runInContext(storyWrapper, context);
              callback(null, result);
            }
          } catch (error: any) {
            // If generator wrapping failed, try as regular async expression
            try {
              const asyncWrapper = `(async () => { return ${cmd} })()`;
              const result = await vm.runInContext(asyncWrapper, context);
              callback(null, result);
            } catch (innerError: any) {
              // Last resort: try as plain expression
              try {
                const result = vm.runInContext(cmd, context);
                callback(null, result);
              } catch (finalError) {
                callback(error, undefined);
              }
            }
          }
        },
        writer: (output: any) => {
          if (output && typeof output === 'object' && 'result' in output && 'logs' in output) {
            // This is a StoryResult, format it nicely
            return util.inspect(output.result, { showHidden: false, depth: null, colors: true });
          }
          return util.inspect(output, { showHidden: false, depth: null, colors: true });
        },
        ignoreUndefined: true,
        preview: false, // Disable preview to make multiline easier
      });

      // Enable editor mode by default for better multiline support
      replServer.setupHistory('.qpq-tinker-history', () => {});

      // Add a helper command to enter editor mode
      replServer.defineCommand('e', {
        help: 'Enter editor mode for multiline input',
        action() {
          (this as any).editorMode = true;
          console.log('// Entering editor mode (Ctrl+D to finish, Ctrl+C to cancel)');
          this.displayPrompt();
        },
      });

      // Start in editor mode if requested
      if (tinkerOptions?.editorMode) {
        console.log('Starting in editor mode. Use Ctrl+D to execute, Ctrl+C to cancel.\n');
        (replServer as any).editorMode = true;
      }

      // Add tinker interface to REPL context
      replServer.context.tinker = tinkerInterface;

      // Add convenience function for quick runs
      replServer.context.run = tinkerInterface.run;

      // Add dynamic require relative to current service
      // This allows importing any module from the service codebase
      // replServer.context.requireLocal = (relativePath: string) => {
      //   // Get the config root from the current service's QPQ config
      //   const currentConfig = getServiceConfig();
      //   const configRoot = qpqCoreUtils.getConfigRoot(currentConfig);

      //   // Resolve the path relative to the service's config root
      //   const fullPath = path.resolve(configRoot, relativePath);

      //   try {
      //     // Clear the require cache to get fresh imports
      //     delete require.cache[require.resolve(fullPath)];
      //     return require(fullPath);
      //   } catch (e) {
      //     // Try without .ts extension if it was included
      //     if (relativePath.endsWith('.ts')) {
      //       const jsPath = fullPath.replace(/\.ts$/, '');
      //       try {
      //         delete require.cache[require.resolve(jsPath)];
      //         return require(jsPath);
      //       } catch (e2) {
      //         // Fall through
      //       }
      //     }

      //     // Try with .js extension if no extension was provided
      //     if (!path.extname(relativePath)) {
      //       try {
      //         delete require.cache[require.resolve(fullPath + '.js')];
      //         return require(fullPath + '.js');
      //       } catch (e3) {
      //         // Fall through
      //       }
      //     }

      //     throw new Error(`Could not resolve module: ${relativePath} from ${configRoot}`);
      //   }
      // };

      // // Import QPQ entry points (queue events, service functions, etc) using the dynamic module loader
      // // This properly loads them in the QPQ runtime context
      // replServer.context.importQpqModule = async (relativePath: string) => {
      //   const currentConfig = getServiceConfig();
      //   const dynamicModuleLoader = getDynamicModuleLoader(currentConfig, devServerConfig);

      //   // Parse the path to create a QPQ function runtime
      //   // Remove .ts extension if present
      //   const cleanPath = relativePath.replace(/\.ts$/, '').replace(/\.js$/, '');

      //   // Extract function name (last part after ::, or last segment)
      //   const pathParts = cleanPath.split('/');
      //   const lastPart = pathParts[pathParts.length - 1];
      //   const [modulePath, functionName] = lastPart.includes('::')
      //     ? lastPart.split('::')
      //     : [lastPart, 'default'];

      //   // Rebuild the path without the function name if it was included
      //   const basePath = lastPart.includes('::')
      //     ? [...pathParts.slice(0, -1), modulePath].join('/')
      //     : cleanPath;

      //   const qpqFunctionRuntime = {
      //     basePath: qpqCoreUtils.getConfigRoot(currentConfig),
      //     relativePath: basePath.startsWith('/') ? basePath : `/${basePath}`,
      //     functionName: functionName
      //   };

      //   try {
      //     const module = await dynamicModuleLoader(qpqFunctionRuntime);

      //     // If it's a function that expects getRun (async QPQ story)
      //     // These are typically queue events, service functions, etc.
      //     if (typeof module === 'function') {
      //       // Create a getRun function for this module
      //       const createGetRun = () => {
      //         return async (storyRuntime: any) => {
      //           // Execute the story in the tinker runtime
      //           const result = await tinkerInterface.run(storyRuntime);
      //           return result.result;
      //         };
      //       };

      //       return {
      //         module,
      //         // Execute with getRun support (for async stories)
      //         execute: async (...args: any[]) => {
      //           try {
      //             // Try calling with getRun as last parameter (async mode)
      //             const getRun = createGetRun();
      //             const result = await module(...args, getRun);
      //             return result;
      //           } catch (e) {
      //             // If that fails, try executing as a regular generator story
      //             if (module.constructor.name === 'GeneratorFunction') {
      //               const result = await tinkerInterface.run(module, args);
      //               return result.result;
      //             }
      //             throw e;
      //           }
      //         },
      //         // Direct access to the module
      //         raw: module
      //       };
      //     }

      //     return module;
      //   } catch (error) {
      //     // Fallback to regular require for non-QPQ modules
      //     console.log('Failed to load as QPQ module, trying regular require...');
      //     return replServer.context.requireLocal(relativePath);
      //   }
      // };

      // // Alias for convenience
      // replServer.context.importLocal = replServer.context.importQpqModule;

      // Update prompt when service changes
      const originalSwitchService = tinkerInterface.switchService;
      tinkerInterface.switchService = (serviceName: string) => {
        originalSwitchService(serviceName);
        replServer.setPrompt(`qpq:${serviceName}> `);
      };

      // Import all the ask functions from quidproquo-core for convenience
      const qpqConxtext = { ...qpqCore, ...qpqWebserver };
      // replServer.context.qpq = qpqConxtext;

      // Add commonly used ask functions directly to context
      Object.keys(qpqConxtext).forEach((key) => {
        // if (key.startsWith('ask')) {
        replServer.context[key] = (qpqConxtext as any)[key];
        // }
      });

      // `.exit` and ctrl+d used to call process.exit outright, which dropped
      // whatever the session had just written and any projection it triggered
      // - the same data-loss bug as an unhandled SIGTERM, in a second place.
      const handleReplExit = async (): Promise<void> => {
        console.log('\n👋 Goodbye from QPQ Tinker!');
        await requestDevServerShutdown();
        process.exit(0);
      };

      replServer.on('exit', () => {
        void handleReplExit();
      });

      // Force display the prompt immediately
      replServer.displayPrompt();
    },
  };

  return tinkerInterface;
};
