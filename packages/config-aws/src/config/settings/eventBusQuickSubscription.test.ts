import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { defineEventBusQuickSubscription, EventBusQuickSubscription, EventBusQuickSubscriptionType } from './eventBusQuickSubscription';

describe('defineEventBusQuickSubscription', () => {
  it('builds a subscription setting keyed by the bus, owned by this service by default', () => {
    const subscriptions: EventBusQuickSubscription[] = [{ type: EventBusQuickSubscriptionType.email, email: 'ops@example.com' }];

    expect(defineEventBusQuickSubscription('alerts', subscriptions)).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsEventBusQuickSubscription,
      uniqueKey: 'alerts',
      eventBusName: 'alerts',
      subscriptions,
      owner: undefined,
    });
  });

  it('binds to the owning module when the bus lives in another service', () => {
    const setting = defineEventBusQuickSubscription('alerts', [{ type: EventBusQuickSubscriptionType.url, url: 'https://hooks.example' }], {
      owner: { module: 'ops' },
    });

    expect(setting.owner).toEqual({ module: 'ops' });
  });
});
