--- START OF FILE webSpeechSttService.ts ---

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
    private finalTranscript: string = ''; // Used to accumulate transcript in continuous mode

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
        this.recognition.interimResults = true; // Keep interim results to build the full transcript
        this.recognition.continuous = true;   // The key change: don't stop on speech pause

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            // Rebuild the full transcript from all result parts
            this.finalTranscript = Array.from(event.results)
              .map(result => result[0])
              .map(result => result.transcript)
              .join('');
            // Do not resolve the promise here; wait for stopRecording() to be called.
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
            this.isRecording = false; // Reset state on error
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.addLogEntry('SYSTEM', 'Gravação (Web Speech API) finalizada.');
            if (this.resolveTranscript) {
                const transcriptToReturn = this.finalTranscript.trim();
                 if (transcriptToReturn) {
                    this.addLogEntry('SYSTEM', `Transcrição final: "${transcriptToReturn}"`);
                    this.resolveTranscript(transcriptToReturn);
                } else {
                    this.addLogEntry('SYSTEM', 'Transcrição final estava vazia.');
                    this.resolveTranscript(null);
                }
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
            this.finalTranscript = ''; // Reset transcript for the new session
            this.addLogEntry('SYSTEM', 'Iniciando gravação (Web Speech API).');
            this.isRecording = true;
            this.resolveTranscript = resolve;
            this.recognition.start();
        });
    }

    public stopRecording(): void {
        if (this.recognition && this.isRecording) {
            // This will trigger the 'onend' event, which now handles resolving the promise with the final transcript.
            this.recognition.stop();
        }
    }

    public cancelRecording(): void {
        if (this.recognition && this.isRecording) {
            this.addLogEntry('SYSTEM', 'Cancelando gravação (Web Speech API).');
            this.finalTranscript = ''; // Ensure no partial transcript is returned
            if (this.resolveTranscript) {
                this.resolveTranscript(null);
                this.resolveTranscript = null;
            }
            // abort() will trigger onend, but the promise is already resolved/cleared.
            this.recognition.abort();
        }
    }
}
--- END OF FILE webSpeechSttService.ts ---
