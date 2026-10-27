import { actionResult, askMetricPut, createActionProcessor, MetricUnit, ProcessorFor, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

// Emits the metric as a CloudWatch Embedded Metric Format (EMF) log line: CloudWatch
// extracts metrics from the function's log stream - no api calls, no extra IAM, no
// latency on the story. Cost: each unique metricName x dimension-combination is one
// custom metric (~$0.30/mo) - the standard dimensions are service/environment(/feature),
// so keep payload dimensions low-cardinality (never per-user / per-request ids).
const getProcessMetricPut = (qpqConfig: QPQConfig): ProcessorFor<typeof askMetricPut> => {
  // The namespace is the deployed app instance - app/environment(/feature) - mirroring how
  // every qpq resource name embeds the deployment identity. Apps sharing an account can't
  // merge same-named metrics, per-developer feature sandboxes (e.g. qpq/docgen/development/jane)
  // never pollute mainline, and dimensions are reserved for slices WITHIN the deployment
  // (service + caller-supplied).
  const application = qpqCoreUtils.getApplicationName(qpqConfig);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);
  const namespace = `qpq/${application}/${environment}${feature ? `/${feature}` : ''}`;

  const service = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  return async ({ metricName, value, unit, dimensions }) => {
    const allDimensions: Record<string, string> = {
      service,
      ...dimensions,
    };

    const emf = {
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: namespace,
            Dimensions: [Object.keys(allDimensions)],
            Metrics: [{ Name: metricName, Unit: unit ?? MetricUnit.count }],
          },
        ],
      },
      ...allDimensions,
      [metricName]: value,
    };

    console.log(JSON.stringify(emf));

    return actionResult(void 0);
  };
};

export const getMetricPutActionProcessor = createActionProcessor(askMetricPut, getProcessMetricPut);
