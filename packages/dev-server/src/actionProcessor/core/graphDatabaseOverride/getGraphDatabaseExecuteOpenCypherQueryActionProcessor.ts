import { getServiceFunctionActionProcessor } from '@qpqjs/actionprocessor-aws';
import {
  ActionProcessorList,
  ActionProcessorListResolver,
  askGraphDatabaseExecuteOpenCypherQuery,
  AskResponse,
  askThrowError,
  ErrorTypeEnum,
  generateUuid,
  getProcessCustomImplementation,
  GraphCypherResponse,
  GraphDatabaseActionType,
  GraphDatabaseExecuteOpenCypherQueryActionPayload,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from '@qpqjs/core';
import { askServiceFunctionExecute } from '@qpqjs/webserver';

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

    const functionName = `graphQuery${graphDatabaseConfig.virtualNetworkName}`;

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
      generateUuid,
    ),
  };
};
