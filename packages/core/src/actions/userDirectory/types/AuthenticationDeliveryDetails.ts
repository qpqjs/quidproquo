export type AuthenticationDeliveryDetails = {
  attributeName: string;
  deliveryMedium: 'EMAIL' | 'SMS';
  destination: string;
};
