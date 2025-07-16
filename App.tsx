import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageSender } from './types';
import { OpenAIAssistantsService } from './services/openaiAssistantsService';
import { ElevenLabsTtsService } from './services/elevenLabsTtsService';
import { WebSpeechSttService } from './services/webSpeechSttService';
import { getUserId } from './services/userService';
import { getHistory, saveHistory } from './services/chatHistoryService';
import ChatPanel from './components/ChatPanel';
import RightPanel from './components/RightPanel';

const App: React.FC = () => {
  // Core state
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isChatActive, setIsChatActive] = useState(false);
  
  // Audio state
  const [isListening, setIsListening] = useState(false);
  const [isAudioOutputEnabled, setIsAudioOutputEnabled] = useState(true);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  
  // Service refs
  const assistantServiceRef = useRef<OpenAIAssistantsService | null>(null);
  const ttsServiceRef = useRef<ElevenLabsTtsService | null>(null);
  const sttServiceRef = useRef<WebSpeechSttService | null>(null);
  
  const addLogEntry = useCallback((source: 'USER' | 'BOT' | 'SYSTEM' | 'API', content: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogEntries(prev => [...prev, `[${timestamp}] [${source}] ${content}`]);
  }, []);

  // Initialize everything on mount
  useEffect(() => {
    const initializeApp = async () => {
      setIsInitializing(true);
      setInitializationError(null);
      
      try {
        // As chaves de API agora estão embutidas para simplificar a demonstração.
        // Em produção, elas devem ser gerenciadas por meio de variáveis de ambiente.
        const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
        const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

        if (!OPENAI_API_KEY || !ELEVENLABS_API_KEY) {
          throw new Error("Chaves de API não configuradas. Verifique as variáveis de ambiente VITE_OPENAI_API_KEY e VITE_ELEVENLABS_API_KEY.");
        }
        
        const currentUserId = getUserId();
        setUserId(currentUserId);
        addLogEntry('SYSTEM', `ID de usuário identificado: ${currentUserId}`);

        // Knowledge base is now managed within the OpenAI Assistant.
        addLogEntry('SYSTEM', 'A base de conhecimento é gerenciada pelo assistente OpenAI.');

        // Initialize audio services
        sttServiceRef.current = new WebSpeechSttService(addLogEntry);
        const sttSupported = WebSpeechSttService.isSupported();
        setIsSpeechRecognitionSupported(sttSupported);
        addLogEntry('SYSTEM', `Reconhecimento de voz ${sttSupported ? 'suportado' : 'não suportado'}.`);
        
        ttsServiceRef.current = new ElevenLabsTtsService(ELEVENLABS_API_KEY, addLogEntry);
        assistantServiceRef.current = new OpenAIAssistantsService(OPENAI_API_KEY, addLogEntry);
        
        await assistantServiceRef.current.init(currentUserId);

        // Load history after services are ready
        const userHistory = getHistory(currentUserId);
        if (userHistory.length > 0) {
            setMessages(userHistory);
            setIsChatActive(true);
            addLogEntry('SYSTEM', `Histórico de conversa de ${userHistory.length} mensagens carregado.`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        addLogEntry('SYSTEM', `Erro de inicialização: ${errorMessage}`);
        setInitializationError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
    
    return () => {
      ttsServiceRef.current?.interrupt();
      sttServiceRef.current?.cancelRecording();
    };
  }, [addLogEntry]);

  const handleStartChat = () => {
    if (messages.length === 0) {
        const welcomeMessage = { id: Date.now().toString(), text: 'Bem-vindo ao suporte da SynthWave Audio! Como posso ajudar?', sender: MessageSender.SYSTEM };
        setMessages([welcomeMessage]);
        addLogEntry('SYSTEM', 'Nenhum histórico encontrado. Iniciando nova conversa.');
    }
    setIsChatActive(true);
  };
  
  useEffect(() => {
    if (userId && isChatActive && messages.length > 0) {
      if (messages.length > 1 || messages[0]?.sender !== MessageSender.SYSTEM) {
        saveHistory(userId, messages);
      }
    }
  }, [userId, messages, isChatActive]);

  const processMessage = useCallback(async (messageText: string) => {
    if (!userId || !isChatActive || !assistantServiceRef.current?.isInitialized) return;
    if (!messageText.trim()) return;

    ttsServiceRef.current?.interrupt();
    setIsLoading(true);
    setInitializationError(null);

    const userMessage: Message = { id: Date.now().toString(), text: messageText, sender: MessageSender.USER };
    setMessages(prev => [...prev, userMessage]);
    addLogEntry('USER', messageText);

    try {
        const stream = assistantServiceRef.current!.sendMessageStream(messageText);
        
        let botResponse = '';
        const botMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMessageId, text: '', sender: MessageSender.BOT }]);

        for await (const chunk of stream) {
            botResponse += chunk;
            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId ? { ...msg, text: botResponse } : msg
            ));
        }
        
        addLogEntry('BOT', botResponse);
        
        if (isAudioOutputEnabled && ttsServiceRef.current) {
            await ttsServiceRef.current.speak(botResponse);
        }
        
    } catch (e) {
        const err = e as Error;
        const errorMessage = `Erro: ${err.message}`;
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: errorMessage, sender: MessageSender.SYSTEM }]);
        addLogEntry('SYSTEM', errorMessage);
        setInitializationError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  }, [userId, isChatActive, addLogEntry, isAudioOutputEnabled]);
  
  const startListening = useCallback(async () => {
    if (isLoading || isInitializing || !isSpeechRecognitionSupported || !sttServiceRef.current || isListening) return;

    ttsServiceRef.current?.interrupt();
    setIsListening(true);
    
    try {
      const transcript = await sttServiceRef.current.startRecording();
      setIsListening(false); 
      if (transcript) {
        await processMessage(transcript);
      } else {
        addLogEntry('SYSTEM', 'A transcrição falhou ou estava vazia.');
      }
    } catch (error) {
       const err = error as Error;
       addLogEntry('SYSTEM', `Erro durante a gravação: ${err.message}`);
       setIsListening(false);
    }
  }, [isLoading, isInitializing, isSpeechRecognitionSupported, isListening, addLogEntry, processMessage]);
  
  const handleSendMessage = useCallback((text: string) => {
    if (!isChatActive) return;

    if (isListening) {
      sttServiceRef.current?.stopRecording();
    } else {
      processMessage(text);
    }
  }, [isChatActive, isListening, processMessage]);

  const toggleAudioOutput = () => {
    setIsAudioOutputEnabled(prev => {
      const newState = !prev;
      if (!newState) {
        ttsServiceRef.current?.interrupt();
      }

      addLogEntry('SYSTEM', `Saída de áudio ${newState ? 'ativada' : 'desativada'}.`);
      return newState;
    });
  };

  const combinedError = initializationError;

  return (
    <div className="h-screen w-screen p-4 sm:p-6 lg:p-8 bg-slate-100 font-sans">
      <div className="grid h-full max-h-full grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-7 h-full max-h-full">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isChatActive={isChatActive && !isInitializing && !initializationError}
            onStartChat={handleStartChat}
            isListening={isListening}
            startListening={startListening}
            cancelListening={cancelListening}
            isSpeechRecognitionSupported={isSpeechRecognitionSupported}
            isAudioOutputEnabled={isAudioOutputEnabled}
            toggleAudioOutput={toggleAudioOutput}
            isInitializing={isInitializing}
            initializationError={initializationError}
          />
        </div>

        <div className="lg:col-span-5 h-full max-h-full">
            <RightPanel
              logEntries={logEntries}
              isInitializing={isInitializing}
            />
        </div>

      </div>
      {combinedError && !isInitializing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg" role="alert">
          <strong className="font-bold">Ocorreu um erro: </strong>
          <span className="block sm:inline">{combinedError}</span>
        </div>
      )}
    </div>
  );
};

export default App;
