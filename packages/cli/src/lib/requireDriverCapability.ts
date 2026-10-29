import { QpqPlatformDriver } from '../platforms';
import { CommandContext } from './resolveCommandContext';

type OptionalCapability = {
  [K in keyof QpqPlatformDriver]-?: undefined extends QpqPlatformDriver[K] ? K : never;
}[keyof QpqPlatformDriver];

// Hands back a driver's optional capability, or stops the command with a message naming the
// platform that lacks it. The capability name doubles as the strategy name in that message.
export const requireDriverCapability = <K extends OptionalCapability>(
  context: CommandContext,
  capability: K,
  hint: string = '',
): NonNullable<QpqPlatformDriver[K]> => {
  const implementation = context.driver[capability];

  if (!implementation) {
    console.error(`The '${context.deployment.platform}' platform has no ${capability} strategy.${hint ? ` ${hint}` : ''}`);
    process.exit(1);
  }

  return implementation as NonNullable<QpqPlatformDriver[K]>;
};
