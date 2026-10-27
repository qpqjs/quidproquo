import { StoryResultMetadataWithChildren } from 'quidproquo-core';
import { useAuthAccessToken, useBaseUrlResolvers, useEffectCallback } from 'quidproquo-web-react';

import { useEffect, useState } from 'react';
import { TreeNodeDatum } from 'react-d3-tree';

import { getLogHierarchy } from '../logic';

const filterQpqActions = (logs: StoryResultMetadataWithChildren[]): StoryResultMetadataWithChildren[] => {
  const filteredLogs: StoryResultMetadataWithChildren[] = [];

  for (const log of logs) {
    if (!log.runtimeType.startsWith('EXECUTE_STORY')) {
      // If the log is a QPQ action, add its children to the filtered logs array
      filteredLogs.push(...filterQpqActions(log.children));
    } else {
      // If the log is not a QPQ action, add it to the filtered logs array
      // and recursively filter its children
      const filteredLog: StoryResultMetadataWithChildren = {
        ...log,
        children: filterQpqActions(log.children),
      };
      filteredLogs.push(filteredLog);
    }
  }

  return filteredLogs;
};

export type TreeDataItem = TreeNodeDatum & StoryResultMetadataWithChildren;

export type TreeApi = {
  treeData?: StoryResultMetadataWithChildren[];
  treeDataWithNoQpqActions?: StoryResultMetadataWithChildren[];
  isLoading: boolean;
  refreshTreeData: () => void;
};

export const useLogTreeData = (correlationId: string, hideQpqActions: boolean = false): TreeApi => {
  const [treeData, setTreeData] = useState<StoryResultMetadataWithChildren[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const baseUrlResolvers = useBaseUrlResolvers();

  const accessToken = useAuthAccessToken();

  const refreshTreeData = async () => {
    setIsLoading(true);
    const logHierarchy = await getLogHierarchy(baseUrlResolvers.getApiUrl(), correlationId, true, accessToken);

    if (logHierarchy) {
      setTreeData([logHierarchy]);
    }

    setIsLoading(false);
  };

  // Stable identity so the effect below can list it as a dependency while
  // still only re-running when a correlation id appears or disappears.
  const fetchTreeData = useEffectCallback(async () => {
    setIsLoading(true);
    console.log('correlationId: ', correlationId);
    const logHierarchy = await getLogHierarchy(baseUrlResolvers.getApiUrl(), correlationId, false, accessToken);

    if (logHierarchy) {
      setTreeData([logHierarchy]);
    }

    setIsLoading(false);
  });

  const hasCorrelationId = !!correlationId;

  useEffect(() => {
    if (hasCorrelationId) {
      fetchTreeData();
    }
  }, [hasCorrelationId, fetchTreeData]);

  const result: TreeApi = {
    isLoading,
    refreshTreeData: refreshTreeData,
    treeDataWithNoQpqActions: treeData ? filterQpqActions(treeData) : treeData,
    treeData: treeData,
  };

  return result;
};
