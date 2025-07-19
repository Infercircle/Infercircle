import React from 'react';
import { ToolExecutionResult } from '@/lib/types/agent';
import { COMPONENT_REGISTRY, ComponentName } from './DynamicComponents';


interface Props {
  result: ToolExecutionResult;
}

// components/ToolResultRenderer.tsx
const ReactComponentRenderer: React.FC<{
  componentName: ComponentName;
  props: Record<string, unknown>;
}> = ({ componentName, props }) => {
  const Component = COMPONENT_REGISTRY[componentName];
  
  if (!Component) {
    return <div>Unknown component: {componentName}</div>;
  }
  
  try {
    return <Component {...props} />;
  } catch (error) {
    console.error('Error rendering component:', error);
    return <div>Error rendering component</div>;
  }
};


const ToolResultRenderer: React.FC<Props> = ({ result }) => {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <div className="bg-red-100 rounded-full p-1 mr-3">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-red-800 font-semibold">Tool Error: {result.toolName}</h4>
        </div>
        <p className="text-red-700">{result.error}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-1 mr-3">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-blue-800 font-semibold">Tool: {result.toolName}</h4>
        </div>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          {result.executionTime}ms
        </span>
      </div>
      
      {/* React Component Rendering */}
      {result.isReactComponent && result.componentName && result.componentProps ? (
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="mb-2 text-sm text-gray-600">React Component Output:</div>
          <ReactComponentRenderer 
            componentName={result.componentName as ComponentName}
            props={result.componentProps}
          />
        </div>
      ) : result.isHtml ? (
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="mb-2 text-sm text-gray-600">HTML Output:</div>
          <div dangerouslySetInnerHTML={{ __html: result.result }} />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded p-4">
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(result.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolResultRenderer;