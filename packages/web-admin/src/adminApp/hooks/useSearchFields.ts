import { LogLevelEnumLookup } from 'quidproquo-core';
import { useFastCallback } from 'quidproquo-web-react';

import { useMemo } from 'react';

import { effectiveLogLevelLookup } from '../logic/search/effectiveLogLevelLookup';
import { effectiveRuntimeType } from '../logic/search/effectiveRuntimeType';
import { AdminSearchParams } from '../types/AdminSearchParams';
import { useAdminApp } from './useAdminApp';
import { useSessionState } from './useSessionState';

type AutoCompleteOption = {
  label: string;
  value: string;
};

// The session-state replacement for the old useUrlFields hook: field values
// come from the folded session, edits become (coalesced) searchParamsChanged
// events, and the URL follows as a projection. Handler names/signatures match
// what TopSection and AdminLogSearchBar already consume.
export const useSearchFields = () => {
  const [api] = useAdminApp();
  const session = useSessionState();
  const search = session.search;

  const applySearch = useFastCallback((partial: Partial<AdminSearchParams>) => {
    api.applySearchParamsChanged({ ...search, ...partial });
  });

  const startDate = useMemo(() => (search.startIsoDateTime ? new Date(search.startIsoDateTime) : new Date()), [search.startIsoDateTime]);
  const endDate = useMemo(() => (search.endIsoDateTime ? new Date(search.endIsoDateTime) : new Date()), [search.endIsoDateTime]);

  const handleRuntimeTypeOnChange = useFastCallback((event: { target: { value: string } }) => {
    applySearch({ runtimeType: event.target.value });
  });

  const handleServiceOnChange = useFastCallback((event: unknown, value: AutoCompleteOption | null) => {
    applySearch({ service: value?.value || '' });
  });

  const handleStartDateChange = useFastCallback((value: Date | null) => {
    applySearch({ startIsoDateTime: value ? value.toISOString() : '' });
  });

  const handleEndDateChange = useFastCallback((value: Date | null) => {
    applySearch({ endIsoDateTime: value ? value.toISOString() : '' });
  });

  const handleUserOnChange = useFastCallback((event: { target: { value: string } }) => {
    applySearch({ user: event.target.value });
  });

  const handleInfoOnChange = useFastCallback((event: { target: { value: string } }) => {
    applySearch({ info: event.target.value });
  });

  const handleMsgOnChange = useFastCallback((event: { target: { value: string } }) => {
    applySearch({ msg: event.target.value });
  });

  const handleErrorOnChange = useFastCallback((event: { target: { value: string } }) => {
    applySearch({ error: event.target.value });
  });

  const handleDeepOnChange = useFastCallback((event: { target: { value: string } }) => {
    applySearch({ deep: event.target.value });
  });

  const handleLogLevelOnChange = useFastCallback((event: { target: { value: string } }) => {
    applySearch({ logLevel: event.target.value });
  });

  const updateStartAndEndTimeSpan = useFastCallback((minutes: number) => {
    const now = new Date();
    const start = new Date(now.getTime() - minutes * 60000);
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60000);

    applySearch({ startIsoDateTime: start.toISOString(), endIsoDateTime: end.toISOString() });
  });

  return {
    search,
    runtimeType: effectiveRuntimeType(search),
    handleRuntimeTypeOnChange,
    service: search.service,
    handleServiceOnChange,
    startDate,
    handleStartDateChange,
    endDate,
    handleEndDateChange,
    user: search.user,
    handleUserOnChange,
    info: search.info,
    handleInfoOnChange,
    msg: search.msg,
    handleMsgOnChange,
    error: search.error,
    handleErrorOnChange,
    deep: search.deep,
    handleDeepOnChange,
    logLevel: effectiveLogLevelLookup(search) as LogLevelEnumLookup,
    handleLogLevelOnChange,
    updateStartAndEndTimeSpan,
  };
};
