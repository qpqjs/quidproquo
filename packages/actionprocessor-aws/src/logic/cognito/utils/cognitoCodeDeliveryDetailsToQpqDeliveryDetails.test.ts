import { describe, expect, it } from 'vitest';

import { cognitoCodeDeliveryDetailsToQpqDeliveryDetails } from './cognitoCodeDeliveryDetailsToQpqDeliveryDetails';

describe('cognitoCodeDeliveryDetailsToQpqDeliveryDetails', () => {
  it('maps the cognito delivery details', () => {
    expect(
      cognitoCodeDeliveryDetailsToQpqDeliveryDetails({ AttributeName: 'phone_number', Destination: '+61***123', DeliveryMedium: 'SMS' }),
    ).toEqual({
      attributeName: 'phone_number',
      destination: '+61***123',
      deliveryMedium: 'SMS',
    });
  });

  it('falls back to email defaults when the details are missing', () => {
    expect(cognitoCodeDeliveryDetailsToQpqDeliveryDetails(undefined)).toEqual({
      attributeName: 'email',
      destination: 'unknown@email.com',
      deliveryMedium: 'EMAIL',
    });
  });
});
