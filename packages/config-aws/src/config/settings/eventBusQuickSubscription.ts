import { CrossModuleOwner, QPQConfigAdvancedSettings, QPQConfigSetting, qpqCoreUtils } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export enum EventBusQuickSubscriptionType {
  email = 'email',
  url = 'url',
}

/**
 * An external endpoint SNS delivers to directly (no compute), for a bus used as
 * an alert channel. `email` sends an email; `url` POSTs to an incident-tool
 * webhook (PagerDuty / Slack / OpsGenie), http/https auto-detected.
 *
 * This is an AWS-specific convenience — direct email/webhook delivery is an SNS
 * feature, not a portable event-bus concept — hence it lives in config-aws and
 * not on core's platform-agnostic `defineEventBus`. For rich, in-band handling
 * use the normal bus -> queue -> function pattern instead.
 */
export type EventBusQuickSubscription =
  { type: EventBusQuickSubscriptionType.email; email: string } | { type: EventBusQuickSubscriptionType.url; url: string };

export interface QPQConfigAdvancedEventBusQuickSubscriptionSettings extends QPQConfigAdvancedSettings {
  /**
   * The module that owns the target bus, when it lives in another service (mirror
   * the `owner` you pass to `defineEventBus`). The subscription then binds only to
   * that owner's bus at deploy, so a same-named bus owned by a different module
   * won't accidentally pick it up. Omit for a bus owned by this service.
   */
  owner?: CrossModuleOwner<'eventBusName'>;
}

export interface EventBusQuickSubscriptionQPQConfigSetting extends QPQConfigSetting {
  eventBusName: string;

  subscriptions: EventBusQuickSubscription[];

  owner?: CrossModuleOwner;
}

/**
 * Attach direct SNS subscribers (email / incident-tool webhook) to an event bus
 * by name. Multiple calls for the same bus are additive. Typically paired with
 * alarm routing (`onAlarm.publishToEventBus`) so operational alerts reach a human
 * out-of-band, without depending on the service's own compute being healthy.
 */
export const defineEventBusQuickSubscription = (
  eventBusName: string,
  subscriptions: EventBusQuickSubscription[],
  options?: QPQConfigAdvancedEventBusQuickSubscriptionSettings,
): EventBusQuickSubscriptionQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsEventBusQuickSubscription,
  uniqueKey: eventBusName,

  eventBusName,

  subscriptions,

  owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
