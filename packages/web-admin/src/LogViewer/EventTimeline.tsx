import { formatDuration, getTimeBounds, getTotalExecutionTime, StoryResultMetadataWithChildren } from 'quidproquo-core';

import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

import { TreeApi } from './hooks';

interface EventTimelineProps {
  logCorrelation: string;
  setSelectedLogCorrelation: (logCorrelation: string) => void;
  isVisible: boolean;
  treeApi: TreeApi;
}

const EVENT_HEIGHT = 30;
const EVENT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8c00', '#ff0080'];

type TimelineEventProps = {
  event: StoryResultMetadataWithChildren;
  level: number;
  setSelectedLogCorrelation: (logCorrelation: string) => void;
  scale: number;
  parrentTimeOffsetMs: number;
  totalParrentTimeOffsetMs: number;
};

const TimelineEvent = ({ event, level, setSelectedLogCorrelation, scale, parrentTimeOffsetMs, totalParrentTimeOffsetMs }: TimelineEventProps) => {
  const eventWidth = event.executionTimeMs * scale;
  const eventOffset = totalParrentTimeOffsetMs * scale;
  const totalTimeOffset = (event.executionTimeMs + totalParrentTimeOffsetMs) * scale;

  return (
    <div style={{ width: totalTimeOffset + 100 }}>
      <div
        style={{
          width: `${eventOffset}px`,
          height: EVENT_HEIGHT,

          textAlign: 'right',
          display: totalTimeOffset ? 'inline-block' : 'none',
        }}
      ></div>
      <div
        onClick={() => setSelectedLogCorrelation(event.correlation)}
        style={{
          whiteSpace: 'nowrap',
          width: `${eventWidth}px`,
          height: EVENT_HEIGHT,
          backgroundColor: EVENT_COLORS[level % EVENT_COLORS.length],
          cursor: 'pointer',
          padding: 3,
          borderRadius: 4,
          display: 'inline-block',
        }}
      >
        {event.moduleName}::{event.generic.split('::').pop()} - @{parrentTimeOffsetMs}ms - {event.executionTimeMs}ms
      </div>
      {event.children.map((child: StoryResultMetadataWithChildren) => {
        const childDate = new Date(child.startedAt);
        const eventDate = new Date(event.startedAt);
        const offsetMs = childDate.getTime() - eventDate.getTime();
        const totalOffset = totalParrentTimeOffsetMs + offsetMs;

        return (
          <TimelineEvent
            key={child.correlation}
            event={child}
            level={level + 1}
            parrentTimeOffsetMs={offsetMs}
            scale={scale}
            setSelectedLogCorrelation={setSelectedLogCorrelation}
            totalParrentTimeOffsetMs={totalOffset}
          />
        );
      })}
    </div>
  );
};

export const EventTimeline: React.FC<EventTimelineProps> = ({ logCorrelation, setSelectedLogCorrelation, isVisible, treeApi }) => {
  const [scaleOffset, setScaleOffset] = useState(0.0);
  const [handleOnWheel, setHandleWheel] = useState<any>(() => () => {});

  const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleWheel = (event: any) => {
      if (event && event.altKey) {
        event.preventDefault(); // Prevent default scrolling behavior
        const delta = event.deltaY > 0 ? -0.01 : 0.01;
        setScaleOffset((prevScale) => Math.max(0.0, prevScale + delta));
      }
    };

    if (timelineRef) {
      timelineRef.addEventListener('wheel', handleWheel);
      setHandleWheel(handleWheel);
    }

    return () => {
      if (timelineRef) {
        timelineRef.removeEventListener('wheel', handleWheel);
      }
    };
  }, [timelineRef]);

  if (treeApi.isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <CircularProgress size={100} />
      </Box>
    );
  }

  if (!treeApi.treeDataWithNoQpqActions) {
    return <div>Error</div>;
  }

  const { earliestStartedAt, latestFinishedAt } = getTimeBounds(treeApi.treeDataWithNoQpqActions);
  const totalExecutionTime = getTotalExecutionTime(treeApi.treeDataWithNoQpqActions);

  const startDate = new Date(earliestStartedAt);
  const endDate = new Date(latestFinishedAt);
  const offsetMs = endDate.getTime() - startDate.getTime();

  const scale = 1100 / offsetMs + scaleOffset;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ height: 24 }}>
        <b>{formatDuration(totalExecutionTime)}</b>
        <i> of compute over </i>
        <b>{formatDuration(offsetMs)}</b>
      </div>
      <div ref={setTimelineRef} onWheel={handleOnWheel} style={{ width: '100%', height: 'calc(100% - 24px)' }}>
        {treeApi.treeDataWithNoQpqActions[0] && (
          <TimelineEvent
            event={treeApi.treeDataWithNoQpqActions[0]}
            level={0}
            parrentTimeOffsetMs={0}
            scale={scale}
            setSelectedLogCorrelation={setSelectedLogCorrelation}
            totalParrentTimeOffsetMs={0}
          />
        )}
      </div>
    </div>
  );
};
