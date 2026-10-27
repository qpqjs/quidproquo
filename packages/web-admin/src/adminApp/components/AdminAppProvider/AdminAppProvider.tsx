import { authContext, QpqContextProvider, QpqRuntimeEffectCatcher } from 'quidproquo-web-react';

import { ReactNode, useContext } from 'react';

import { adminAppRuntime } from '../../adminAppRuntime';
import { AdminUserContext, adminUserContext } from '../../contexts/adminUserContext';

type AdminAppProviderProps = {
  children?: ReactNode;
};

// Mounts only once authenticated (inside Auth), so the first bind of the
// adminApp area IS session start: the definition's onInit creates the session
// doc, seeds it from the URL, and runs the flush loop until logout unmounts
// the subtree and the area is released.
export const AdminAppProvider: React.FC<AdminAppProviderProps> = ({ children }) => {
  const authState = useContext(authContext);

  const adminUser: AdminUserContext = {
    username: authState?.username ?? '',
  };

  return (
    <QpqContextProvider contextIdentifier={adminUserContext} value={adminUser}>
      <QpqRuntimeEffectCatcher runtime={adminAppRuntime}>{children}</QpqRuntimeEffectCatcher>
    </QpqContextProvider>
  );
};
