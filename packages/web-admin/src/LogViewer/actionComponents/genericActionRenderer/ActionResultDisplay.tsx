import TruncatedText from '../../TruncatedText';
import { ActionComponent } from '../types';
import { genericFunctionRendererStyles } from './AnyVariableView';
import { AnyVariableView } from './AnyVariableView';

const ActionResultDisplay: ActionComponent = ({ result, expanded }) => {
  const [successResult, errorResult] = result || [];

  return (
    <>
      {successResult !== undefined && !errorResult && (
        <pre style={genericFunctionRendererStyles.pre}>
          <span>Result: </span>
          <AnyVariableView expanded={expanded} value={successResult} />
        </pre>
      )}
      {errorResult !== undefined && (
        <pre style={genericFunctionRendererStyles.pre}>
          <AnyVariableView expanded={expanded} value={errorResult} />
        </pre>
      )}
    </>
  );
};

// Make sure to export ActionResultDisplay if it's defined in a separate file
export default ActionResultDisplay;
