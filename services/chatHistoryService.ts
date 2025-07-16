
import { Message } from '../types';

/**
 * Obtém o histórico de conversas de um usuário do localStorage.
 * @param userId - O ID do usuário.
 * @returns Um array de mensagens ou um array vazio se não houver histórico ou ocorrer um erro.
 */
export function getHistory(userId: string): Message[] {
  const historyJson = localStorage.getItem(`synthwave_chat_history_${userId}`);
  if (historyJson) {
    try {
      return JSON.parse(historyJson);
    } catch (e) {
      console.error("Falha ao analisar o histórico de chat:", e);
      // Em caso de erro de análise, limpa o histórico corrompido.
      localStorage.removeItem(`synthwave_chat_history_${userId}`);
      return [];
    }
  }
  return [];
}

/**
 * Salva o histórico de conversas de um usuário no localStorage.
 * @param userId - O ID do usuário.
 * @param messages - O array de mensagens a serem salvas.
 */
export function saveHistory(userId: string, messages: Message[]): void {
  try {
    const historyJson = JSON.stringify(messages);
    localStorage.setItem(`synthwave_chat_history_${userId}`, historyJson);
  } catch (e) {
    console.error("Falha ao salvar o histórico de chat:", e);
  }
}
