// components/ChatPanel.tsx

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
  stopAndSendTranscript: () => void;
  cancelListening: () => void;
  isSpeechRecognitionSupported: boolean;
  isAudioOutputEnabled: boolean;
  toggleAudioOutput: () => void;
  isInitializing: boolean;
  initializationError: string | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  isChatActive,
  onStartChat,
  isListening,
  startListening,
  stopAndSendTranscript,
  cancelListening,
  isSpeechRecognitionSupported,
  isAudioOutputEnabled,
  toggleAudioOutput,
  isInitializing,
  initializationError,
}) => {
  const [input, setInput] = React.useState('');

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg p-4">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`mb-2 ${msg.sender === 'USER' ? 'text-right' : 'text-left'}`}
          >
            <span
              className={`inline-block px-3 py-2 rounded-xl ${
                msg.sender === 'USER' ? 'bg-blue-200' : 'bg-slate-200'
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* Entrada de texto & controles de voz */}
      <div className="flex gap-2 items-end">
        <input
          className="flex-1 border rounded-lg px-4 py-2 disabled:opacity-50"
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (
              e.key === 'Enter' &&
              !isListening &&
              !isLoading &&
              isChatActive
            ) {
              onSendMessage(input);
              setInput('');
            }
          }}
          disabled={!isChatActive || isListening || isLoading}
        />

        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          onClick={() => {
            onSendMessage(input);
            setInput('');
          }}
          disabled={!isChatActive || isListening || isLoading}
        >
          Enviar
        </button>

        {!isListening ? (
          <button
            className={`px-4 py-2 rounded-lg hover:bg-slate-400 disabled:opacity-50 ${
              isSpeechRecognitionSupported
                ? 'bg-slate-300 text-slate-800'
                : 'bg-slate-100 text-slate-400'
            }`}
            onClick={startListening}
            disabled={!isSpeechRecognitionSupported || isLoading}
          >
            🎤 Falar
          </button>
        ) : (
          <>
            <button
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
              onClick={stopAndSendTranscript}
              disabled={isLoading}
            >
              Enviar
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              onClick={cancelListening}
              disabled={isLoading}
            >
              Cancelar
            </button>
          </>
        )}

        <button
          className="ml-2 px-2 py-1 rounded hover:bg-slate-200"
          onClick={toggleAudioOutput}
          title="Alternar saída de áudio"
        >
          {isAudioOutputEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Botão iniciar chat */}
      {!isChatActive && (
        <button
          className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={onStartChat}
        >
          Iniciar chat
        </button>
      )}

      {/* Erro de inicialização */}
      {initializationError && (
        <div className="mt-2 text-sm text-red-600">{initializationError}</div>
      )}

      {/* Status do reconhecimento de voz */}
      <div className="mt-1 text-xs text-slate-400">
        {isSpeechRecognitionSupported
          ? 'Reconhecimento de voz disponível.'
          : 'Reconhecimento de voz não suportado neste navegador.'}
      </div>
    </div>
  );
};

export default ChatPanel;
