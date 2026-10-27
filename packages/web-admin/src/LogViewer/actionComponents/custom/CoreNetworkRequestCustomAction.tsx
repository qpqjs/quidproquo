import { NetworkRequestActionPayload } from 'quidproquo-core';

import { GenericFunctionRenderer, genericFunctionRendererStyles } from '../genericActionRenderer';
import ActionResultDisplay from '../genericActionRenderer/ActionResultDisplay';
import { ActionComponent } from '../types';

export const CoreNetworkRequestCustomAction: ActionComponent<NetworkRequestActionPayload<any>> = ({ action, result, expanded }) => {
  if (!action.payload) {
    return null;
  }

  return (
    <>
      <pre style={genericFunctionRendererStyles.pre}>
        <GenericFunctionRenderer
          args={[
            action.payload.method,
            action.payload.url,
            {
              body: action.payload.body,
              headers: action.payload.headers,
              basePath: action.payload.basePath,
              params: action.payload.params,
              responseType: action.payload.responseType,
            },
          ]}
          expanded={expanded}
          functionName={'askNetworkRequest'}
          tooltipMap={['method', 'url', 'httpRequestOptions']}
        />
      </pre>
      <ActionResultDisplay action={action} expanded={expanded} result={result} />
    </>
  );
};
