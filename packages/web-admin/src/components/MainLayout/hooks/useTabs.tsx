import BugReportIcon from '@mui/icons-material/BugReport';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ExtensionIcon from '@mui/icons-material/Extension';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TerminalIcon from '@mui/icons-material/Terminal';

import { ActionSearch } from '../../../ActionSearch';
import { Config } from '../../../Config';
import { FederatedTab } from '../../../FederatedAddon';
import { AdminLogs } from '../../../LogViewer/AdminLogs/AdminLogs';
import { Dashboard } from '../../../LogViewer/Dashboard';
import { LogSearch } from '../../../LogViewer/LogSearch';
import { Maintenance } from '../../../Maintenance';
import { useFederatedAddon } from '../../../useFederatedAddon';

export function useTabs(): {
  tabs: FederatedTab[];
  loading: boolean;
} {
  const { addons, loading } = useFederatedAddon();

  const allTabs: FederatedTab[] = [
    {
      name: 'Events',
      View: LogSearch,
      icon: <RestoreIcon />,
    },
    {
      name: 'Logs',
      View: AdminLogs,
      icon: <TerminalIcon />,
    },
    {
      name: 'Search',
      View: ActionSearch,
      icon: <SearchIcon />,
    },
    {
      name: 'Errors',
      View: Dashboard,
      icon: <BugReportIcon />,
    },
    {
      name: 'Advanced',
      View: Config,
      icon: <SettingsIcon />,
    },
    {
      name: 'Maintenance',
      View: Maintenance,
      icon: <EngineeringIcon />,
    },
    ...addons.map((addon) => ({
      ...addon.tab,
      icon: <ExtensionIcon />,
    })),
  ];

  return {
    tabs: allTabs,
    loading,
  };
}
