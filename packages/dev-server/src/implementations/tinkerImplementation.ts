import { createRuntime, getDateNow, QPQConfig, qpqCoreUtils, QpqRuntimeType, Story, StoryResult } from '@qpqjs/core';
import * as qpqCore from '@qpqjs/core';
import * as qpqWebserver from '@qpqjs/webserver';

import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import * as repl from 'repl';
import * as util from 'util';
import * as vm from 'vm';

import { getDevServerActionProcessors } from '../actionProcessor';
import { requestDevServerShutdown } from '../logic';
import { ResolvedDevServerConfig, TinkerInterface, TinkerOptions } from '../types';
import { getDevServerLogger } from './logger';

// The REPL is an interactive terminal, so stdout is its UI. Every line the tinker
// prints goes through here, which keeps the rest of the file free of console calls.
const tinkerPrint = (line: string): void => {
  console.log(line);
};

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
      tinkerPrint(`Switched to service: ${serviceName}`);
    },

    getCurrentService: () => currentServiceName,

    getServices: () => availableServices,

    getServiceConfig,

    startRepl: () => {
      tinkerPrint(`\n🔧 QPQ Tinker - Interactive Development Environment`);
      tinkerPrint(`📦 Current service: ${currentServiceName}`);
      tinkerPrint(`📚 Available services: ${availableServices.join(', ')}\n`);
      tinkerPrint(`Commands:`);
      tinkerPrint(`  .editor or .e  - Enter multiline editor mode`);
      tinkerPrint(`  .help         - Show all commands`);
      tinkerPrint(`  .exit         - Exit tinker\n`);
      tinkerPrint(`Usage (automatically runs in QPQ context):`);
      tinkerPrint(`  yield* askDateNow()                        - Direct generator code`);
      tinkerPrint(`  yield* askExecuteServiceFunction(...)      - Call service functions`);
      tinkerPrint(`  tinker.switchService('serviceName')        - Change service context`);
      tinkerPrint(`  tinker.getServices()                       - List services\n`);
      tinkerPrint(`Tip: Code is automatically wrapped in a generator function and executed via run()\n`);

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

      // History can hold literal secrets typed at the prompt, so it lives under the
      // gitignored runtime folder rather than the project root.
      const historyPath = path.resolve(devServerConfig.runtimePath, 'tinker-history');
      fs.mkdirSync(path.dirname(historyPath), { recursive: true });
      replServer.setupHistory(historyPath, () => {});

      // Add a helper command to enter editor mode
      replServer.defineCommand('e', {
        help: 'Enter editor mode for multiline input',
        action() {
          (this as any).editorMode = true;
          tinkerPrint('// Entering editor mode (Ctrl+D to finish, Ctrl+C to cancel)');
          this.displayPrompt();
        },
      });

      // Start in editor mode if requested
      if (tinkerOptions?.editorMode) {
        tinkerPrint('Starting in editor mode. Use Ctrl+D to execute, Ctrl+C to cancel.\n');
        (replServer as any).editorMode = true;
      }

      // Add tinker interface to REPL context
      replServer.context.tinker = tinkerInterface;

      // Add convenience function for quick runs
      replServer.context.run = tinkerInterface.run;

      // Update prompt when service changes
      const originalSwitchService = tinkerInterface.switchService;
      tinkerInterface.switchService = (serviceName: string) => {
        originalSwitchService(serviceName);
        replServer.setPrompt(`qpq:${serviceName}> `);
      };

      // Import all the ask functions from @qpqjs/core for convenience
      const qpqConxtext = { ...qpqCore, ...qpqWebserver };

      // Add commonly used ask functions directly to context
      Object.keys(qpqConxtext).forEach((key) => {
        replServer.context[key] = (qpqConxtext as any)[key];
      });

      // `.exit` and ctrl+d go through the shutdown sequence: exiting outright
      // would drop whatever the session had just written and any projection it
      // triggered, the same data loss as an unhandled SIGTERM.
      const handleReplExit = async (): Promise<void> => {
        tinkerPrint('\n👋 Goodbye from QPQ Tinker!');
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
