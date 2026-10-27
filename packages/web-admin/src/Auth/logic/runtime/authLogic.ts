import { askAuthUISetPassword, askAuthUISetUsername } from '../authActionCreator';
import { askAuthLogin } from './askAuthLogin';
import { askAuthLogout } from './askAuthLogout';
import { askAuthMain } from './askAuthMain';

export const authLogic = {
  askAuthLogin,
  askAuthLogout,
  askAuthMain,

  askAuthUISetUsername,
  askAuthUISetPassword,
};
