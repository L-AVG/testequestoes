import React, { useState, useEffect, useRef } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';

interface LogPanelProps {
  logEntries: string[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logEntries }) => {
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logEntries]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logEntries.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-700">Registro da Conversa</h2>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <ClipboardIcon className="h-4 w-4" />
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>
      <div
        ref={logContainerRef}
        className="flex-grow overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2"
      >
        <pre className="whitespace-pre-wrap text-xs text-slate-600">
          {logEntries.length > 0 ? logEntries.join('\n') : 'O registro aparecerá aqui...'}
        </pre>
      </div>
    </div>
  );
};

export default LogPanel;