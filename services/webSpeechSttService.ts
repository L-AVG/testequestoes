// services/webSpeechSttService.ts

type AddLogEntryType = (source: 'USER' | 'BOT' | 'SYSTEM' | 'API', content: string) => void;

export class WebSpeechSttService {
  recognition: SpeechRecognition;
  isRecording: boolean;
  lastTranscript: string; // Aqui armazenamos o texto continuamente
  resolve?: (t: string) => void;
  reject?: (err: any) => void;
  addLogEntry?: AddLogEntryType;

  static isSupported() {
    return typeof window !== 'undefined' &&
      (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
  }

  constructor(addLogEntry?: AddLogEntryType) {
    this.addLogEntry = addLogEntry;
    const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) throw new Error("Web Speech API não suportada.");
    this.recognition = new SpeechRecognitionImpl();

    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.isRecording = false;
    this.lastTranscript = '';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) {
          final += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      this.lastTranscript = (final + interim).trim();
      if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Parcial: ${this.lastTranscript}`);
    };

    this.recognition.onerror = (event: any) => {
      if (this.isRecording && this.reject) {
        if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Erro: ${event.error}`);
        this.reject(event.error);
        this.isRecording = false;
      }
    };

    // Reinicia se o reconhecimento parar sozinho
    this.recognition.onend = () => {
      if (this.isRecording) {
        if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Reiniciando reconhecimento (onend automático)`);
        try {
          this.recognition.start();
        } catch (e) {
          // Ignora erro de start duplicado
        }
      }
    };
  }

  startRecording(): Promise<string> {
    this.lastTranscript = '';
    this.isRecording = true;
    try {
      this.recognition.start();
      if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Gravação iniciada`);
    } catch (e) {
      if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Erro ao iniciar: ${e}`);
      throw e;
    }

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  stopRecording() {
    this.isRecording = false;
    try {
      this.recognition.stop();
      if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Gravação encerrada pelo usuário`);
    } catch (e) {
      if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Erro ao parar: ${e}`);
    }
    // Sempre retorna o último texto registrado, mesmo que o recognition tenha parado antes!
    if (this.resolve) {
      this.resolve(this.lastTranscript);
      this.resolve = undefined;
      this.reject = undefined;
    }
  }

  cancelRecording() {
    this.isRecording = false;
    try {
      this.recognition.abort();
      if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Gravação abortada`);
    } catch (e) {
      if (this.addLogEntry) this.addLogEntry('SYSTEM', `[STT] Erro ao abortar: ${e}`);
    }
    if (this.resolve) {
      this.resolve('');
      this.resolve = undefined;
      this.reject = undefined;
    }
  }
}
