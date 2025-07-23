// components/RightPanel.tsx

import React from 'react';

interface RightPanelProps {
  logEntries: string[];
  isInitializing: boolean;
}

const RightPanel: React.FC<RightPanelProps> = ({ logEntries, isInitializing }) => {
  const [collapsed, setCollapsed] = React.useState(true);

  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg p-4">
      <button
        onClick={toggleCollapse}
        className="self-start mb-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
      >
        {collapsed ? 'Mostrar registro da conversa' : 'Ocultar registro da conversa'}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto border rounded p-2 bg-slate-50">
          {isInitializing ? (
            <div className="text-xs italic text-gray-500">Carregando...</div>
          ) : (
            logEntries.map((entry, idx) => (
              <div key={idx} className="text-xs font-mono whitespace-pre-wrap mb-1">
                {entry}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RightPanel;
