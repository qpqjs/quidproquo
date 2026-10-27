import { getServiceFunctionActionProcessor } from 'quidproquo-actionprocessor-awslambda';
import {
  ActionProcessorList,
  ActionProcessorListResolver,
  askGraphDatabaseExecuteOpenCypherQuery,
  AskResponse,
  askThrowError,
  ErrorTypeEnum,
  getProcessCustomImplementation,
  GraphCypherResponse,
  GraphDatabaseActionType,
  GraphDatabaseExecuteOpenCypherQueryActionPayload,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from 'quidproquo-core';
import { askServiceFunctionExecute } from 'quidproquo-webserver';

import { randomUUID } from 'crypto';

const getGraphDatabaseExecuteOpenCypherStory = (qpqConfig: QPQConfig) => {
  return function* askRunNeptuneOpenCypherQuery(
    graphDatabaseExecuteOpenCypherQueryActionPayload: GraphDatabaseExecuteOpenCypherQueryActionPayload,
  ): AskResponse<GraphCypherResponse> {
    const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

    const graphDatabaseConfig = qpqCoreUtils
      .getOwnedGraphDatabases(qpqConfig)
      .find((graphDatabaseConfig) => graphDatabaseConfig.name === graphDatabaseExecuteOpenCypherQueryActionPayload.graphDatabaseName);

    if (!graphDatabaseConfig) {
      return yield* askThrowError(
        ErrorTypeEnum.GenericError,
        `Invalid graph config for [${graphDatabaseExecuteOpenCypherQueryActionPayload.graphDatabaseName}]`,
      );
    }

    const functionName = `graphQuery${graphDatabaseConfig.virualNetworkName}`;

    return yield* askServiceFunctionExecute<GraphCypherResponse, GraphDatabaseExecuteOpenCypherQueryActionPayload>(
      serviceName,
      functionName,
      graphDatabaseExecuteOpenCypherQueryActionPayload,
    );
  };
};

export const getGraphDatabaseExecuteOpenCypherQueryActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
): Promise<ActionProcessorList> => {
  return {
    [GraphDatabaseActionType.ExecuteOpenCypherQuery]: getProcessCustomImplementation<ProcessorFor<typeof askGraphDatabaseExecuteOpenCypherQuery>>(
      qpqConfig,
      getGraphDatabaseExecuteOpenCypherStory(qpqConfig),
      'Neptune Cypher Query - dev server',
      // Make sure the service functions that its trying to execute are in aws and not local
      // as we use the service functions to proxy the queries though the VPC
      getServiceFunctionActionProcessor,
      () => new Date().toISOString(),
      randomUUID,
    ),
  };
};
