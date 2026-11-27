/**
 * Famílias de cor do filtro do catálogo.
 *
 * As cores das peças são texto livre ("Preto Com Rosa", "Off-white",
 * "Marom"…). O filtro agrupa por família olhando cada palavra do nome, então
 * "Preto Com Rosa" aparece em Preto e em Rosa, e erros de digitação comuns
 * ("Peto", "Cnza", "Marom") caem na família certa.
 */
export type FamiliaCor = { id: string; nome: string; hex: string; palavras: string[] };

export const FAMILIAS_COR: FamiliaCor[] = [
  { id: 'preto', nome: 'Preto', hex: '#111111', palavras: ['preto', 'preta', 'peto', 'black'] },
  { id: 'branco', nome: 'Branco e off-white', hex: '#F4F0E8', palavras: ['branco', 'branca', 'bramco', 'off', 'offwhite', 'gelo', 'creme', 'perola'] },
  { id: 'bege', nome: 'Bege e nude', hex: '#D9C3A5', palavras: ['bege', 'nude', 'taupe', 'areia', 'palha'] },
  { id: 'marrom', nome: 'Marrom e caramelo', hex: '#7A4E2D', palavras: ['marrom', 'marom', 'chocolate', 'caramelo', 'cafe', 'camel', 'conhaque', 'tabaco'] },
  { id: 'vermelho', nome: 'Vermelho e vinho', hex: '#A82238', palavras: ['vermelho', 'vermelha', 'vinho', 'bordo', 'marsala'] },
  { id: 'rosa', nome: 'Rosa e pink', hex: '#E5A5B0', palavras: ['rosa', 'rose', 'pink', 'lilas'] },
  { id: 'azul', nome: 'Azul e marinho', hex: '#2B4A7A', palavras: ['azul', 'marinho', 'jeans'] },
  { id: 'cinza', nome: 'Cinza e prata', hex: '#8A8C90', palavras: ['cinza', 'cnza', 'prata', 'grafite', 'chumbo'] },
  { id: 'roxo', nome: 'Roxo', hex: '#6B4A7A', palavras: ['roxo', 'roxa', 'violeta', 'uva'] },
  { id: 'verde', nome: 'Verde', hex: '#4A6B4A', palavras: ['verde', 'militar', 'oliva'] },
  { id: 'amarelo', nome: 'Amarelo e dourado', hex: '#D9AE3C', palavras: ['amarelo', 'amarela', 'dourado', 'dourada', 'mostarda', 'ouro'] },
  { id: 'laranja', nome: 'Laranja', hex: '#D2691E', palavras: ['laranja', 'terracota', 'coral'] },
];

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** As famílias de um nome de cor ("Preto Com Rosa" → preto, rosa). */
export function familiasDaCor(nome: string): string[] {
  const todas = semAcento(nome).replace(/-/g, '').split(/[^a-z]+/).filter(Boolean);
  // "Preto com logo branca": a cor da logo não é a cor da peça.
  const palavras = todas.filter((_, i) => todas[i - 1] !== 'logo');
  // "off white" / "off-white" vira "off" + "white" ou "offwhite": os dois casam.
  return FAMILIAS_COR.filter((f) => f.palavras.some((p) => palavras.includes(p))).map((f) => f.id);
}
