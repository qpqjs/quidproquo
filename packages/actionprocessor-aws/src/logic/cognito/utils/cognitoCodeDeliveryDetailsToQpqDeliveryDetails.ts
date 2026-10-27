import { AuthenticationDeliveryDetails } from 'quidproquo-core';

import { CodeDeliveryDetailsType } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Maps Cognito code-delivery details onto qpq AuthenticationDeliveryDetails,
 * defaulting to email delivery when Cognito omits any of the details.
 */
export const cognitoCodeDeliveryDetailsToQpqDeliveryDetails = (details: CodeDeliveryDetailsType | undefined): AuthenticationDeliveryDetails => ({
  attributeName: details?.AttributeName || 'email',
  destination: details?.Destination || 'unknown@email.com',
  deliveryMedium: details?.DeliveryMedium === 'SMS' ? 'SMS' : 'EMAIL',
});
