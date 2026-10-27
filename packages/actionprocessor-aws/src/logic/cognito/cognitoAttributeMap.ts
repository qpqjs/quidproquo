import { UserAttributes } from 'quidproquo-core';

/** Maps qpq UserAttributes keys to their Cognito standard attribute names. */
export const cognitoAttributeMap: Record<keyof UserAttributes, string> = {
  email: 'email',
  emailVerified: 'email_verified',
  userId: 'sub',

  address: 'address',
  birthDate: 'birthdate',
  familyName: 'family_name',
  gender: 'gender',
  givenName: 'given_name',
  locale: 'locale',
  middleName: 'middle_name',
  name: 'name',
  nickname: 'nickname',
  phoneNumber: 'phone_number',
  picture: 'picture',
  preferredUsername: 'preferred_username',
  profile: 'profile',
  website: 'website',
  zoneInfo: 'zoneinfo',
};
