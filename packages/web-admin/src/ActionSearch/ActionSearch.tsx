import { Nullable } from 'quidproquo-core';
import { ActionSearchActionRow, ActionSearchFilter } from 'quidproquo-features';

import { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { CorrelationOpenSource, useAdminApp, useSessionState } from '../adminApp';
import { AsyncButton } from '../components/AsyncButton';
import { TabViewBox } from '../components/TabViewBox';
import { LogDialog } from '../LogViewer/LogDialog';
import { usePlatformApiPost } from '../view/hooks/useAsyncRequest';
import { ActionSearchFilterForm } from './components/ActionSearchFilterForm';
import { ActionSearchGrid } from './components/ActionSearchGrid';
import { EntityTimelineDialog } from './components/EntityTimelineDialog';
import { ActionSearchResultRow, useActionSearch } from './hooks/useActionSearch';
import { useActionSearchViews } from './hooks/useActionSearchViews';
import { EntityTimeline } from './types/EntityTimeline';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const ActionSearch = () => {
  const [api] = useAdminApp();
  const session = useSessionState();

  const views = useActionSearchViews();

  const [viewKey, setViewKey] = useState(views[0]?.key ?? '');
  const [startDate, setStartDate] = useState<Nullable<Date>>(() => new Date(Date.now() - DAY_IN_MS));
  const [endDate, setEndDate] = useState<Nullable<Date>>(() => new Date());
  const [filters, setFilters] = useState<ActionSearchFilter[]>([]);
  const [timeline, setTimeline] = useState<Nullable<EntityTimeline>>(null);

  const getEntityTimeline = usePlatformApiPost<ActionSearchActionRow[]>('/actionSearch/entity/timeline');

  const view = views.find((searchView) => searchView.key === viewKey) ?? null;

  const { rows, isSearching, runSearch } = useActionSearch(view);

  const handleViewChange = (event: SelectChangeEvent) => {
    setViewKey(event.target.value);
    setFilters([]);
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      return;
    }

    await runSearch(startDate.toISOString(), endDate.toISOString(), filters);
  };

  const openLog = (correlation: string) => api.applyCorrelationOpened(correlation, CorrelationOpenSource.grid);

  // Fetch here, in the event that creates the need, so the dialog stays presentational
  const openEntityTimeline = async (linkKey: string) => {
    const rows = await getEntityTimeline({ linkKey });

    setTimeline({ linkKey, rows });
  };

  const handleRowClick = (row: ActionSearchResultRow) => {
    if (view?.kind === 'entity') {
      openEntityTimeline(String(row.linkKey));
      return;
    }

    openLog(String(row.correlation));
  };

  const selectedLogCorrelation = session.openCorrelation ?? '';
  const clearSelectedLogCorrelation = () => api.applyCorrelationClosed();
  const setSelectedLogCorrelation = (correlation: string) => api.applyCorrelationOpened(correlation, CorrelationOpenSource.tree);

  const renderHeader = () => (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Grid columns={12} container spacing={2}>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <InputLabel id="action-search-view-label">View</InputLabel>
            <Select label="View" labelId="action-search-view-label" onChange={handleViewChange} value={viewKey}>
              {views.map((searchView) => (
                <MenuItem key={searchView.key} value={searchView.key}>
                  {searchView.viewName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <DateTimePicker label="Start DateTime" onChange={setStartDate} value={startDate} />
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <DateTimePicker label="End DateTime" onChange={setEndDate} value={endDate} />
          </FormControl>
        </Grid>
        <Grid item xs={3}>
          <AsyncButton onClick={handleSearch}>Search</AsyncButton>
        </Grid>
        <Grid item xs={12}>
          {view && <ActionSearchFilterForm fields={view.fields} filters={filters} onFiltersChange={setFilters} />}
        </Grid>
      </Grid>
    </LocalizationProvider>
  );

  const renderBody = () => (
    <>
      {view && <ActionSearchGrid isLoading={isSearching} onRowClick={handleRowClick} rows={rows} view={view} />}
      <EntityTimelineDialog onClose={() => setTimeline(null)} onOpenLog={openLog} timeline={timeline} />
      <LogDialog
        handleClose={clearSelectedLogCorrelation}
        logCorrelation={selectedLogCorrelation}
        open={!!selectedLogCorrelation}
        setSelectedLogCorrelation={setSelectedLogCorrelation}
        storyResultMetadatas={[]}
      />
    </>
  );

  return <TabViewBox body={renderBody} header={renderHeader} />;
};
