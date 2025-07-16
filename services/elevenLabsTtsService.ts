/**
 * A service for managing Text-to-Speech (TTS) functionality using the ElevenLabs API.
 */
export class ElevenLabsTtsService {
  private apiKey: string;
  private audio: HTMLAudioElement | null = null;
  private addLogEntry: (source: 'SYSTEM', content: string) => void;
  private static VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (popular default voice)

  constructor(apiKey: string, addLogEntry: (source: 'SYSTEM', content: string) => void) {
    if (!apiKey) {
      const errorMsg = 'Chave de API da ElevenLabs não fornecida para o serviço TTS.';
      addLogEntry('SYSTEM', errorMsg);
      throw new Error(errorMsg);
    }
    this.apiKey = apiKey;
    this.addLogEntry = addLogEntry;
  }

  public async speak(text: string): Promise<void> {
    if (!text.trim()) return;
    
    this.interrupt();

    this.addLogEntry('SYSTEM', `Gerando áudio com a API ElevenLabs (voz: ${ElevenLabsTtsService.VOICE_ID})...`);
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ElevenLabsTtsService.VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          model_id: 'eleven_turbo_v2_5',
          text,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.detail?.message || errorMessage;
        } catch (e) {
            // Ignore if response is not JSON
        }
        throw new Error(`API ElevenLabs TTS (${response.status}): ${errorMessage}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      this.audio = new Audio(audioUrl);
      this.addLogEntry('SYSTEM', 'Reproduzindo áudio gerado.');
      
      this.audio.play().catch(e => {
        const errorMessage = e instanceof Error ? e.message : String(e);
        this.addLogEntry('SYSTEM', `Erro ao reproduzir áudio: ${errorMessage}`);
        console.error("Audio playback error:", e);
      });

      this.audio.onended = () => { 
        this.audio = null; 
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.addLogEntry('SYSTEM', `Falha ao gerar áudio: ${message}`);
      console.error("Error in ElevenLabsTtsService:", error);
    }
  }

  public interrupt(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
      this.addLogEntry('SYSTEM', 'Reprodução de áudio interrompida.');
    }
  }
}
