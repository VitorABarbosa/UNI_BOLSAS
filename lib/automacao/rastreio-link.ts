/** Página pública de rastreio (sem login), pra mandar à cliente. */
export function linkDeRastreio(codigo: string): string {
  return `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(codigo)}`;
}
