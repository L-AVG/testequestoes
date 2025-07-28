// As instruções agora são gerenciadas na configuração do Assistente OpenAI.

const API_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIAssistantsService {
  private apiKey: string;
  private addLogEntry: (source: 'SYSTEM' | 'API', content: string) => void;
  private assistantId: string | null = null;
  private threadId: string | null = null;
  public isInitialized = false;

  constructor(apiKey: string, addLogEntry: (source: 'SYSTEM' | 'API', content: string) => void) {
    if (!apiKey) throw new Error('Chave de API da OpenAI não fornecida.');
    this.apiKey = apiKey;
    this.addLogEntry = addLogEntry;
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
        ...options.headers,
      },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText }}));
        throw new Error(`OpenAI API Error (${response.status}): ${errorData.error.message}`);
    }
    return response;
  }
  
  public async init(userId: string): Promise<void> {
    try {
      this.addLogEntry('SYSTEM', 'Inicializando o serviço de assistente OpenAI...');
      await this.getOrCreateAssistant();
      await this.getOrCreateThread(userId);
      this.isInitialized = true;
      this.addLogEntry('SYSTEM', 'Serviço de assistente OpenAI inicializado com sucesso.');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.addLogEntry('SYSTEM', `Falha ao inicializar o assistente: ${message}`);
        console.error(error);
        throw new Error(`Falha na inicialização do assistente: ${message}`);
    }
  }

  private async getOrCreateAssistant(): Promise<void> {
    const PRECONFIGURED_ASSISTANT_ID = 'asst_VQbuuAERlLbZaIC95bPTvVMU';
    this.addLogEntry('SYSTEM', `Usando o ID de assistente pré-configurado: ${PRECONFIGURED_ASSISTANT_ID}`);

    try {
        const assistant = await this.apiRequest(`/assistants/${PRECONFIGURED_ASSISTANT_ID}`).then(res => res.json());
        this.assistantId = assistant.id;
        this.addLogEntry('SYSTEM', `Assistente pré-configurado "${assistant.name}" (${this.assistantId}) carregado com sucesso.`);
        // Nota: A base de conhecimento e as instruções deste assistente são gerenciadas
        // diretamente na plataforma OpenAI e não faremos upload de arquivos locais.
    } catch (error) {
        this.addLogEntry('SYSTEM', `Falha ao carregar o assistente pré-configurado ${PRECONFIGURED_ASSISTANT_ID}. Verifique se o ID está correto e se a chave de API tem permissão para acessá-lo.`);
        // Propaga o erro para ser tratado pelo método init.
        throw error;
    }
  }

  private async getOrCreateThread(userId: string): Promise<void> {
    const threadKey = `openai_thread_id_${userId}`;
    let threadId = localStorage.getItem(threadKey);
    if (threadId) {
        // Opcional: poderíamos verificar se a thread existe, mas para simplificar, confiamos no localStorage
        this.threadId = threadId;
        this.addLogEntry('SYSTEM', `Thread existente encontrada: ${this.threadId}`);
    } else {
        const thread = await this.apiRequest('/threads', { method: 'POST' }).then(res => res.json());
        this.threadId = thread.id;
        localStorage.setItem(threadKey, this.threadId);
        this.addLogEntry('SYSTEM', `Nova thread criada: ${this.threadId}`);
    }
  }

  public async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.isInitialized || !this.assistantId || !this.threadId) {
      throw new Error("Serviço de assistente não inicializado.");
    }
    this.addLogEntry('API', `Enviando mensagem para a thread ${this.threadId}`);
    await this.apiRequest(`/threads/${this.threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role: 'user', content: message }),
    });

    const runStreamResponse = await this.apiRequest(`/threads/${this.threadId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ assistant_id: this.assistantId, stream: true }),
    });
    
    const reader = runStreamResponse.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = '';
    let eventName = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Manter a última linha, possivelmente incompleta

        for (const line of lines) {
            if (line.startsWith('event:')) {
                eventName = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
                const data = line.substring(5).trim();
                if (data === '[DONE]') {
                    this.addLogEntry('API', 'Streaming finalizado.');
                    return;
                }
                
                if (eventName === 'thread.message.delta') {
                    try {
                        const eventData = JSON.parse(data);
                        // A estrutura JSON para este evento é: { delta: { content: [...] } }
                        const textChunk = eventData.delta?.content?.[0]?.text?.value;
                        if (textChunk) {
                            yield textChunk;
                        }
                    } catch (e) {
                        console.error("Erro ao analisar evento do stream:", data, e);
                    }
                }
            } else if (line.trim() === '') {
                // Linha vazia significa o fim de um evento, redefinir o nome do evento
                eventName = '';
            }
        }
    }
  }
}
