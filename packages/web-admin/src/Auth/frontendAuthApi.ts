import { askAuthUISetPassword } from './actionCreators/askAuthUISetPassword';
import { askAuthUISetUsername } from './actionCreators/askAuthUISetUsername';
import { askAuthLogin } from './logic/askAuthLogin';
import { askAuthLogout } from './logic/askAuthLogout';
import { askAuthMain } from './logic/askAuthMain';

/** The auth area's api surface; composes only. */
export const frontendAuthApi = {
  askAuthLogin,
  askAuthLogout,
  askAuthMain,

  askAuthUISetUsername,
  askAuthUISetPassword,
};
