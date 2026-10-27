import React from 'react';

import { ActionComponent } from '../types';
import ActionResultDisplay from './ActionResultDisplay';
import { GenericFunctionRenderer, genericFunctionRendererStyles } from './AnyVariableView'; // Assuming this is the correct path

export const getGenericActionRenderer = (functionName: string, argMap: string[], tooltipMap: string[] = argMap): ActionComponent => {
  const GenericActionRenderer: ActionComponent = ({ action, expanded, result }) => {
    const anyPayload = action.payload as any;
    const args = argMap.reduce((acc, arg) => ({ ...acc, [arg]: anyPayload[arg] }), {});

    return (
      <>
        <pre style={genericFunctionRendererStyles.pre}>
          <GenericFunctionRenderer args={args} expanded={expanded} functionName={functionName} tooltipMap={tooltipMap} />
        </pre>
        <ActionResultDisplay action={action} expanded={expanded} result={result} />
      </>
    );
  };

  return GenericActionRenderer;
};
