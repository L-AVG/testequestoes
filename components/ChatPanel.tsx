import React from 'react';
import { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isChatActive: boolean;
  onStartChat: () => void;
  isListening: boolean;
  startListening: () => void;
  cancelListening: () => void;
  isSpeechRecognitionSupported: boolean;
  isAudioOutputEnabled: boolean;
  toggleAudioOutput: () => void;
  isInitializing: boolean;
  initializationError: string | null;

  // Novas props:
  pendingTranscript: string | null;
  setPendingTranscript: (v: string | null) => void;
  handleSendTranscript: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  isChatActive,
  onStartChat,
  isListening,
  startListening,
  cancelListening,
  isSpeechRecognitionSupported,
  isAudioOutputEnabled,
  toggleAudioOutput,
  isInitializing,
  initializationError,

  pendingTranscript,
  setPendingTranscript,
  handleSendTranscript,
}) => {
  const [input, setInput] = React.useState('');

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-2 ${msg.sender === 'USER' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded-xl ${msg.sender === 'USER' ? 'bg-blue-200' : 'bg-slate-200'}`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      {/* BLOCO DA TRANSCRIÇÃO PENDENTE */}
      {pendingTranscript && (
        <div className="mb-4 p-4 bg-yellow-100 rounded-lg shadow">
          <div className="mb-2 font-semibold">Transcrição pronta:</div>
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            value={pendingTranscript}
            onChange={e => setPendingTranscript(e.target.value)}
          />
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSendTranscript}
            disabled={isLoading}
          >
            Enviar
          </button>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <input
          className="flex-1 border rounded-lg px-4 py-2"
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { onSendMessage(input); setInput(''); } }}
          disabled={!isChatActive || isLoading}
        />
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          onClick={() => { onSendMessage(input); setInput(''); }}
          disabled={!isChatActive || isLoading}
        >
          Enviar
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${isListening ? 'bg-red-600 text-white' : 'bg-slate-300 text-slate-800'}`}
          onClick={isListening ? cancelListening : startListening}
          disabled={!isSpeechRecognitionSupported || isLoading}
        >
          {isListening ? 'Parar' : '🎤 Falar'}
        </button>
      </div>
      {!isChatActive && (
        <button
          className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={onStartChat}
        >
          Iniciar chat
        </button>
      )}
      <div className="mt-2 text-xs text-slate-400">
        {isSpeechRecognitionSupported ? 'Reconhecimento de voz disponível.' : 'Reconhecimento de voz não suportado neste navegador.'}
      </div>
    </div>
  );
};

export default ChatPanel;
