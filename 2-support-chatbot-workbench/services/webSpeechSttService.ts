// The SpeechRecognition-related types are declared globally in `types.ts` and should not be imported.

/**
 * A service for managing Speech-to-Text (STT) functionality using the browser's native Web Speech API.
 * This service does not require any external API keys.
 */
export class WebSpeechSttService {
    private recognition: SpeechRecognition | null = null;
    private resolveTranscript: ((value: string | null) => void) | null = null;
    private addLogEntry: (source: 'SYSTEM', content: string) => void;
    private isRecording: boolean = false;

    constructor(addLogEntry: (source: 'SYSTEM', content: string) => void) {
        this.addLogEntry = addLogEntry;
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            this.recognition = new SpeechRecognitionAPI();
            this.setupRecognition();
        } else {
            this.addLogEntry('SYSTEM', 'Web Speech API (STT) não é suportado neste navegador.');
        }
    }

    private setupRecognition() {
        if (!this.recognition) return;
        this.recognition.lang = 'pt-BR';
        this.recognition.interimResults = false;
        this.recognition.continuous = false;

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            this.addLogEntry('SYSTEM', `Transcrição recebida: "${transcript}"`);
            if (this.resolveTranscript) {
                this.resolveTranscript(transcript);
                this.resolveTranscript = null;
            }
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            let errorMessage = `Erro no reconhecimento de voz: ${event.error}`;
            if (event.error === 'no-speech') errorMessage = 'Nenhuma fala foi detectada.';
            else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') errorMessage = 'Permissão para o microfone negada ou serviço não permitido.';
            this.addLogEntry('SYSTEM', errorMessage);
            if (this.resolveTranscript) {
                this.resolveTranscript(null);
                this.resolveTranscript = null;
            }
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.addLogEntry('SYSTEM', 'Gravação (Web Speech API) finalizada.');
            if (this.resolveTranscript) { // Resolve if not already resolved by onresult
                this.resolveTranscript(null); // Resolves with null for timeout/no-speech case
                this.resolveTranscript = null;
            }
        };
    }

    public static isSupported(): boolean {
        return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    }

    public startRecording(): Promise<string | null> {
        return new Promise((resolve) => {
            if (this.isRecording) {
                this.addLogEntry('SYSTEM', 'Gravação já em progresso.');
                return resolve(null);
            }
            if (!this.recognition) {
                this.addLogEntry('SYSTEM', 'Tentativa de gravar, mas a Web Speech API não é suportada.');
                return resolve(null);
            }
            this.addLogEntry('SYSTEM', 'Iniciando gravação (Web Speech API).');
            this.isRecording = true;
            this.resolveTranscript = resolve;
            this.recognition.start();
        });
    }

    public stopRecording(): void {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
    }

    public cancelRecording(): void {
        if (this.recognition && this.isRecording) {
            this.addLogEntry('SYSTEM', 'Cancelando gravação (Web Speech API).');
            if (this.resolveTranscript) {
                this.resolveTranscript(null);
                this.resolveTranscript = null;
            }
            this.recognition.abort();
        }
    }
}
