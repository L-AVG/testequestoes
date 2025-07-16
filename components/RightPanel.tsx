import React from 'react';
import LogPanel from './LogPanel';

interface RightPanelProps {
  logEntries: string[];
  isInitializing: boolean;
}

const RightPanel: React.FC<RightPanelProps> = ({ logEntries, isInitializing }) => {
  return (
    <div className="flex h-full max-h-full flex-col">
      {isInitializing ? (
         <div className="flex h-full flex-col items-center justify-center bg-white p-4 rounded-lg shadow-md text-center">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
           <h3 className="text-lg font-semibold text-slate-700">Inicializando...</h3>
           <p className="text-sm text-slate-500">Configurando o assistente de IA. Isso pode levar um momento.</p>
         </div>
      ) : (
        <LogPanel logEntries={logEntries} />
      )}
    </div>
  );
};

export default RightPanel;
