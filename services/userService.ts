
/**
 * Obtém o ID do usuário do localStorage. Se não existir, gera um novo UUID,
 * o salva e o retorna.
 * @returns O ID de usuário único e persistente.
 */
export function getUserId(): string {
  let userId = localStorage.getItem('synthwave_chat_userId');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('synthwave_chat_userId', userId);
  }
  return userId;
}
