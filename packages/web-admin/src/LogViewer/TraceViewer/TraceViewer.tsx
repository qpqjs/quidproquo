import { QpqExecutionTrace } from 'quidproquo-core';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Slider,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { LocalValueTree } from './LocalValueTree';
import {
  buildLineAnnotations,
  formatLineAnnotation,
  getDefaultSourceIndex,
  getDisplaySourceNames,
  isExternalSourcePath,
  RETURNS_MATCH_NAME,
  searchStepValues,
} from './traceViewerLogic';

interface TraceViewerProps {
  trace: QpqExecutionTrace;

  // "My code only" lives with the tab (not here) so Re-run Trace can send it to the
  // tracer — a re-trace with it on never sets breakpoints outside the user's own code
  hideExternalSteps: boolean;
  onHideExternalStepsChange: (hideExternalSteps: boolean) => void;

  // Tab-owned controls (the Re-run Trace button) rendered at the end of the header row
  // so they don't need a row of their own
  actions?: React.ReactNode;
}

// Layout notes (deliberate, don't regress):
// - the slider row contains ONLY the prev/slider/next controls — any text that changes
//   width as you scrub (step counter, function names) lives in the rows above instead,
//   so the slider never jumps under the pointer
// - source paths are enormous (federated chunk files) — everything that shows one is
//   width-bounded with tail-ellipsis (rtl trick keeps the distinguishing END visible)
//   and carries the full path in a tooltip

const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Ellipsis that keeps the END of the text visible — for paths the tail is the part
// that differs. (rtl only changes which side collapses; the string itself is ltr.)
const tailEllipsisStyle: React.CSSProperties = {
  direction: 'rtl',
  overflow: 'hidden',
  textAlign: 'left',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const codeAreaStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '12px',
  lineHeight: '20px',
  overflow: 'auto',
  whiteSpace: 'pre',
  height: '100%',
  border: '1px solid rgba(128, 128, 128, 0.3)',
  borderRadius: 4,
};

export const TraceViewer: React.FC<TraceViewerProps> = ({ trace, hideExternalSteps, onHideExternalStepsChange, actions }) => {
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(() => getDefaultSourceIndex(trace));
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const highlightedLineRef = useRef<HTMLDivElement | null>(null);

  const annotations = useMemo(() => buildLineAnnotations(trace, selectedSourceIndex), [trace, selectedSourceIndex]);
  const displaySourceNames = useMemo(() => getDisplaySourceNames(trace.sources.map((traceSource) => traceSource.path)), [trace.sources]);

  // The scrubber walks these indexes into trace.steps — all of them, or only the steps
  // that resolved into the user's own code when the "my code" filter is on.
  const visibleStepIndexes = useMemo(() => {
    const externalSourceIndexes = new Set(
      trace.sources.flatMap((traceSource, sourceIndex) => (isExternalSourcePath(traceSource.path) ? [sourceIndex] : [])),
    );
    return trace.steps.flatMap((step, stepIndex) => (hideExternalSteps && externalSourceIndexes.has(step.sourceIndex) ? [] : [stepIndex]));
  }, [trace, hideExternalSteps]);

  // Position of the selected step within the visible list (-1 while it's filtered out)
  const selectedPosition = visibleStepIndexes.indexOf(selectedStepIndex);

  // Turning the filter on while parked on an external step — snap forward to the next
  // own-code step (or back to the last one)
  useEffect(() => {
    if (selectedPosition === -1 && visibleStepIndexes.length > 0) {
      const nextVisible = visibleStepIndexes.find((stepIndex) => stepIndex > selectedStepIndex);
      setSelectedStepIndex(nextVisible ?? visibleStepIndexes[visibleStepIndexes.length - 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPosition, visibleStepIndexes]);

  // Value search — which (visible) steps carry the query in a variable name, preview,
  // or deep json capture. Ordered, so the first match is where the value first appears.
  const matches = useMemo(() => searchStepValues(trace, searchQuery, visibleStepIndexes), [trace, searchQuery, visibleStepIndexes]);
  const matchStepIndexes = useMemo(() => matches.map((match) => match.stepIndex), [matches]);
  const currentMatchNumber = matchStepIndexes.indexOf(selectedStepIndex) + 1;

  const goToMatch = (direction: 1 | -1) => {
    if (matchStepIndexes.length === 0) {
      return;
    }
    if (direction === 1) {
      const next = matchStepIndexes.find((stepIndex) => stepIndex > selectedStepIndex);
      setSelectedStepIndex(next ?? matchStepIndexes[0]);
    } else {
      const previous = [...matchStepIndexes].reverse().find((stepIndex) => stepIndex < selectedStepIndex);
      setSelectedStepIndex(previous ?? matchStepIndexes[matchStepIndexes.length - 1]);
    }
  };

  // Match marks on the scrubber — where the searched value lives across the run
  const matchMarks = useMemo(() => {
    const positionByStepIndex = new Map(visibleStepIndexes.map((stepIndex, position) => [stepIndex, position]));
    return matches.flatMap((match) => {
      const position = positionByStepIndex.get(match.stepIndex);
      return position === undefined ? [] : [{ value: position }];
    });
  }, [matches, visibleStepIndexes]);

  const selectedStepMatchedNames = useMemo(
    () => new Set(matches.find((match) => match.stepIndex === selectedStepIndex)?.matchedNames ?? []),
    [matches, selectedStepIndex],
  );

  const selectedStep = trace.steps[selectedStepIndex];
  const source = trace.sources[selectedSourceIndex];
  const sourceLines = useMemo(() => (source?.content ? source.content.split('\n') : null), [source]);

  // Scrubbing into a step from another source file follows the execution there — keyed
  // on the step index only, so manual source selection isn't fought by the effect.
  useEffect(() => {
    if (selectedStep && selectedStep.sourceIndex !== selectedSourceIndex) {
      setSelectedSourceIndex(selectedStep.sourceIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStepIndex]);

  useEffect(() => {
    highlightedLineRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedStepIndex, selectedSourceIndex]);

  const highlightedLine = selectedStep && selectedStep.sourceIndex === selectedSourceIndex ? selectedStep.line : undefined;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
      {/* header row — source picker, stats, and the tab's actions (Re-run Trace) */}
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, minWidth: 0 }}>
        {trace.sources.length > 1 ? (
          <FormControl size="small" sx={{ flexShrink: 0, width: 280 }}>
            <Select
              MenuProps={{ PaperProps: { sx: { maxWidth: 680 } } }}
              onChange={(event) => setSelectedSourceIndex(Number(event.target.value))}
              renderValue={(sourceIndex) => <span style={tailEllipsisStyle}>{displaySourceNames[sourceIndex as number]}</span>}
              value={selectedSourceIndex}
            >
              {trace.sources.map((traceSource, sourceIndex) => (
                <MenuItem
                  key={traceSource.path}
                  sx={{ direction: 'rtl', display: 'block', overflow: 'hidden', textAlign: 'left', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={traceSource.path}
                  value={sourceIndex}
                >
                  {displaySourceNames[sourceIndex]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Tooltip title={source?.path || ''}>
            <Typography sx={{ ...tailEllipsisStyle, flexShrink: 0, width: 280 }} variant="caption">
              {displaySourceNames[selectedSourceIndex]}
            </Typography>
          </Tooltip>
        )}

        <Chip label={`${trace.steps.length} steps`} size="small" sx={{ flexShrink: 0 }} />
        <Chip label={`${trace.stats.replayMs}ms replay`} size="small" sx={{ flexShrink: 0 }} />
        {trace.stats.instrumentMs !== undefined && <Chip label={`${trace.stats.instrumentMs}ms setup`} size="small" sx={{ flexShrink: 0 }} />}
        {trace.stats.instrumentedScriptUrls && (
          <Tooltip
            title={
              <span style={{ whiteSpace: 'pre-line' }}>
                {`Scripts that received breakpoints — steps are only recorded in these:\n${trace.stats.instrumentedScriptUrls.join('\n')}`}
              </span>
            }
          >
            <Chip label={`${trace.stats.instrumentedScriptUrls.length} scripts traced`} size="small" sx={{ flexShrink: 0 }} />
          </Tooltip>
        )}
        {trace.truncated && <Chip color="warning" label="truncated - step budget hit" size="small" sx={{ flexShrink: 0 }} />}

        <Tooltip title="Hide steps in framework / node_modules code — scrub only through this service's own source">
          <FormControlLabel
            control={<Checkbox checked={hideExternalSteps} onChange={(event) => onHideExternalStepsChange(event.target.checked)} size="small" />}
            label={<Typography variant="caption">My code only</Typography>}
            sx={{ flexShrink: 0, ml: 0.5, mr: 0 }}
          />
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        {actions}
      </Box>

      {/* search row — find where a value appears across the trace's variables; also the
          step indicator's stable home (it changes width while scrubbing, so it must not
          share a row with the slider) */}
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, px: 1 }}>
        <TextField
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              goToMatch(1);
            }
          }}
          placeholder="Find in variables — names, values, nested json"
          size="small"
          sx={{ width: 380 }}
          value={searchQuery}
        />
        <IconButton disabled={matchStepIndexes.length === 0} onClick={() => goToMatch(-1)} size="small">
          ◀
        </IconButton>
        <IconButton disabled={matchStepIndexes.length === 0} onClick={() => goToMatch(1)} size="small">
          ▶
        </IconButton>
        {searchQuery && (
          <Typography color="text.secondary" variant="caption">
            {matchStepIndexes.length === 0
              ? 'no matches'
              : currentMatchNumber > 0
                ? `match ${currentMatchNumber} of ${matchStepIndexes.length} steps`
                : `${matchStepIndexes.length} matching steps`}
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        <Chip
          label={`step ${selectedPosition + 1} / ${visibleStepIndexes.length}${hideExternalSteps ? ` (${trace.steps.length} total)` : ''}`}
          size="small"
          sx={{ flexShrink: 0 }}
          variant="outlined"
        />
      </Box>

      {/* slider row — controls only, fixed geometry while scrubbing */}
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 2, px: 1 }}>
        <IconButton disabled={selectedPosition <= 0} onClick={() => setSelectedStepIndex(visibleStepIndexes[selectedPosition - 1])} size="small">
          ◀
        </IconButton>
        <Slider
          marks={matchMarks.length > 0 ? matchMarks : undefined}
          max={Math.max(visibleStepIndexes.length - 1, 0)}
          min={0}
          onChange={(event, value) => setSelectedStepIndex(visibleStepIndexes[value as number])}
          size="small"
          sx={{ '& .MuiSlider-mark': { backgroundColor: 'warning.main', height: 8, width: 2 } }}
          value={Math.max(selectedPosition, 0)}
          valueLabelDisplay="auto"
          valueLabelFormat={(position) => `step ${position + 1}`}
        />
        <IconButton
          disabled={selectedPosition === -1 || selectedPosition >= visibleStepIndexes.length - 1}
          onClick={() => setSelectedStepIndex(visibleStepIndexes[selectedPosition + 1])}
          size="small"
        >
          ▶
        </IconButton>
      </Box>

      {/* main area — code on the left, Watch panel on the right */}
      <Box sx={{ display: 'flex', flex: 1, gap: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {!sourceLines && (
            <Alert severity="info">
              No source content available for this file (no source map in the code store) — steps reference {source?.path} by line only.
            </Alert>
          )}

          {sourceLines && (
            <div style={codeAreaStyle}>
              {sourceLines.map((lineText, lineIndex) => {
                const lineNumber = lineIndex + 1;
                const annotation = annotations.get(lineNumber);
                const isHighlighted = lineNumber === highlightedLine;

                return (
                  <div
                    key={lineNumber}
                    ref={isHighlighted ? highlightedLineRef : undefined}
                    onClick={() => {
                      // Jump the scrubber to this line's first visit (among visible steps)
                      const stepIndex = visibleStepIndexes.find(
                        (visibleStepIndex) =>
                          trace.steps[visibleStepIndex].sourceIndex === selectedSourceIndex && trace.steps[visibleStepIndex].line === lineNumber,
                      );
                      if (stepIndex !== undefined) {
                        setSelectedStepIndex(stepIndex);
                      }
                    }}
                    style={{
                      backgroundColor: isHighlighted ? 'rgba(255, 200, 0, 0.25)' : annotation ? 'rgba(0, 160, 255, 0.06)' : undefined,
                      cursor: annotation ? 'pointer' : undefined,
                      display: 'flex',
                    }}
                  >
                    <span
                      style={{
                        color: 'rgba(128, 128, 128, 0.8)',
                        flexShrink: 0,
                        padding: '0 8px',
                        textAlign: 'right',
                        userSelect: 'none',
                        width: 48,
                      }}
                    >
                      {lineNumber}
                    </span>
                    <span style={{ flexShrink: 0 }}>{lineText}</span>
                    {annotation && (
                      <span style={{ color: 'rgba(128, 160, 128, 0.9)', fontStyle: 'italic', paddingLeft: 24 }}>
                        {`// ${formatLineAnnotation(annotation)}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Box>

        {/* Watch — the selected step's locals, expandable */}
        <Box
          sx={{
            border: '1px solid rgba(128, 128, 128, 0.3)',
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            minWidth: 240,
            overflow: 'hidden',
            width: '33%',
          }}
        >
          <Box sx={{ borderBottom: '1px solid rgba(128, 128, 128, 0.3)', px: 1, py: 0.5 }}>
            <Typography sx={{ fontWeight: 600 }} variant="caption">
              Watch
            </Typography>
            {selectedStep && (
              <Typography color="text.secondary" noWrap sx={{ display: 'block' }} variant="caption">
                {selectedStep.functionName || '(anonymous)'} : line {selectedStep.line}
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1, fontFamily: monoFont, fontSize: '12px', lineHeight: '18px', overflow: 'auto', p: 1 }}>
            {selectedStep?.returnValue && (
              <div
                style={{
                  borderBottom: '1px solid rgba(128, 128, 128, 0.3)',
                  marginBottom: 4,
                  paddingBottom: 4,
                  ...(selectedStepMatchedNames.has(RETURNS_MATCH_NAME) ? { backgroundColor: 'rgba(255, 200, 0, 0.18)' } : {}),
                }}
              >
                <LocalValueTree name={RETURNS_MATCH_NAME} value={selectedStep.returnValue} />
              </div>
            )}
            {selectedStep ? (
              Object.entries(selectedStep.locals).map(([name, value]) => (
                <div
                  key={name}
                  style={selectedStepMatchedNames.has(name) ? { backgroundColor: 'rgba(255, 200, 0, 0.18)', borderRadius: 2 } : undefined}
                >
                  <LocalValueTree name={name} value={value} />
                </div>
              ))
            ) : (
              <Typography color="text.secondary" variant="caption">
                No step selected
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
