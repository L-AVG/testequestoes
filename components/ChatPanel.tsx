import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageSender } from '../types';
import SendIcon from './icons/SendIcon';
import UserIcon from './icons/UserIcon';
import BotIcon from './icons/BotIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SpeakerOnIcon from './icons/SpeakerOnIcon';
import SpeakerOffIcon from './icons/SpeakerOffIcon';
import TrashIcon from './icons/TrashIcon';


interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
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
}

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const isSystem = message.sender === MessageSender.SYSTEM;

  if (isSystem) {
    const isError = message.text.toLowerCase().startsWith('erro:');
    return (
      <div className="my-2 text-center text-xs text-slate-500">
        <p className={`rounded-full px-3 py-1 inline-block ${isError ? 'bg-red-200 text-red-800' : 'bg-slate-200'}`}>{message.text}</p>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
          <BotIcon className="h-5 w-5" />
        </div>
      )}
      <div
        className={`max-w-xl rounded-lg px-4 py-2 shadow ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-200 text-slate-800'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-600 text-white">
          <UserIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};


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
  initializationError
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  useEffect(() => {
    if (isListening) {
      setInputValue('');
    }
  }, [isListening]);

  const handleSend = () => {
    if (!isChatActive || isLoading) return;

    if (isListening || inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isListening) {
      handleSend();
    }
  };

  const getPlaceholderText = () => {
    if (isInitializing) return "Inicializando assistente...";
    if (initializationError) return "Erro na inicialização. Verifique os registros.";
    if (isListening) return "Gravando... Pressione Enviar para finalizar.";
    if (!isChatActive) return "Clique em 'Iniciar Conversa' para começar.";
    return "Digite sua mensagem ou use o microfone...";
  }
  
  const isInputDisabled = !isChatActive || isLoading || isListening || isInitializing || !!initializationError;

  return (
    <div className="flex h-full flex-col bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center border-b pb-3 mb-3">
          <h2 className="text-lg font-bold text-slate-700">Suporte SynthWave</h2>
          <button
            onClick={toggleAudioOutput}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label={isAudioOutputEnabled ? "Desativar saída de áudio" : "Ativar saída de áudio"}
          >
            {isAudioOutputEnabled ? <SpeakerOnIcon className="h-6 w-6" /> : <SpeakerOffIcon className="h-6 w-6" />}
          </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-4 -mr-4">
        {!isChatActive ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BotIcon className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">Pronto para começar?</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">
              {initializationError ? 
                `Não foi possível iniciar o assistente. Verifique o registro para mais detalhes.` : 
                `Clique no botão abaixo para iniciar o chat.`
              }
            </p>
            <button
              onClick={onStartChat}
              disabled={isInitializing || !!initializationError}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar Conversa
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
                <div className="flex items-start gap-3 my-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                        <BotIcon className="h-5 w-5" />
                    </div>
                    <div className="max-w-xl rounded-lg px-4 py-2 shadow bg-slate-200 text-slate-800">
                        <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText()}
            disabled={isInputDisabled}
            className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
          {isSpeechRecognitionSupported && (
            isListening ? (
              <button
                onClick={cancelListening}
                className="flex-shrink-0 rounded-full p-2 text-white bg-red-600 hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                aria-label="Cancelar gravação"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={startListening}
                disabled={isInputDisabled || !!inputValue.trim()}
                className="flex-shrink-0 rounded-full p-2 text-white bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Começar a ouvir"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>
            )
          )}
          <button
            onClick={handleSend}
            disabled={isInputDisabled || (!inputValue.trim() && !isListening)}
            className="flex-shrink-0 rounded-full bg-indigo-600 p-2 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Enviar mensagem"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
