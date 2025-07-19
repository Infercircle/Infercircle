import React from 'react';
import { ToolExecutionResult } from '@/lib/types/agent';
import { COMPONENT_REGISTRY, ComponentName } from './DynamicComponents';
import { FiClock } from 'react-icons/fi';


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
    return <div className="text-red-400">Unknown component: {componentName}</div>;
  }
  
  try {
    // Ensure props are valid for the component
    const safeProps = props || {};
    return <Component {...safeProps} />;
  } catch (error) {
    console.error('Error rendering component:', error);
    return <div className="text-red-400">Error rendering component: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
};


const ToolResultRenderer: React.FC<Props> = ({ result }) => {
  if (!result.success) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <div className="bg-red-500/20 rounded-full p-1 mr-3">
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-red-300 font-semibold">Tool Error: {result.toolName}</h4>
        </div>
        <p className="text-red-200">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1C23] border border-[#2A2D34] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="bg-[#A259FF]/20 rounded-full p-1 mr-3">
            <svg className="w-4 h-4 text-[#A259FF]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-[#A259FF] font-semibold">Tool: {result.toolName}</h4>
        </div>
        <span className="text-xs text-[#6B7280] bg-[#2A2D34] px-2 py-1 rounded flex justify-center items-center">
          <FiClock className="inline mr-1" />
          {result.executionTime}ms
        </span>
      </div>
      
      {/* React Component Rendering */}
      {result.isReactComponent && result.componentName && result.componentProps ? (
        <div className="bg-[#0F1114] border border-[#2A2D34] rounded p-4">
          <div className="mb-2 text-sm text-[#6B7280]">React Component Output:</div>
          <ReactComponentRenderer 
            componentName={result.componentName as ComponentName}
            props={result.componentProps}
          />
        </div>
      ) : result.isHtml ? (
        <div className="bg-[#0F1114] border border-[#2A2D34] rounded p-4">
          <div className="mb-2 text-sm text-[#6B7280]">HTML Output:</div>
          <div dangerouslySetInnerHTML={{ __html: result.result }} />
        </div>
      ) : (
        <div className="bg-[#0F1114] border border-[#2A2D34] rounded p-4">
          <pre className="text-sm overflow-x-auto text-[#E5E7EB]">
            {JSON.stringify(result.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolResultRenderer;