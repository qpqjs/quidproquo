import { Action, AuthenticationDeliveryDetails, ConfigActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askForgotPassword } from './askForgotPassword';

describe('askForgotPassword', () => {
  it('starts a reset against the resolved directory and returns delivery details', () => {
    const deliveryDetails: AuthenticationDeliveryDetails = {
      attributeName: 'email',
      deliveryMedium: 'EMAIL',
      destination: 'a***@b.com',
    };
    let captured: Action<any> | undefined;

    const result = runStory(askForgotPassword('a@b.com'), {
      [ConfigActionType.GetGlobal]: 'my-directory',
      [UserDirectoryActionType.ForgotPassword]: (action: Action<any>) => {
        captured = action;
        return deliveryDetails;
      },
    });

    expect(captured?.payload).toEqual({ userDirectoryName: 'my-directory', username: 'a@b.com' });
    expect(result).toBe(deliveryDetails);
  });
});
