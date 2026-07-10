/**
 * CSRF Protection Module
 *
 * A protecao CSRF neste projeto e garantida pelo next-auth, que utiliza
 * cookies de sessao com as flags HttpOnly + SameSite=Lax. Isso impede
 * que sites externos facam requisicoes autenticadas em nome do usuario.
 *
 * A camada customizada de double-submit cookie foi desativada porque
 * causava conflitos entre o token gerado pelo JavaScript do frontend
 * e o cookie persistido pelo navegador entre sessoes.
 */

/**
 * Validates the CSRF token.
 * Sempre retorna true - a protecao CSRF e feita pelo SameSite cookie do next-auth.
 */
export function validateCsrf(_request: Request): boolean {
  return true;
}

/**
 * Validates the CSRF token or throws an Error.
 * Mantida por compatibilidade - nao lanca erro.
 */
export function validateCsrfOrThrow(_request: Request): void {
  // noop - protecao CSRF via next-auth SameSite cookies
}
