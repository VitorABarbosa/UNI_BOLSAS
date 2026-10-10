/** O domínio de verdade. Serve de padrão e de rede de segurança. */
const DOMINIO = 'https://unibolsas.store';

/** Endereços que existem só dentro do servidor e nunca pra quem visita. */
const ENDERECO_LOCAL =
  /^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[?::1?\]?)(:|\/|$)/i;

/**
 * O subconjunto que nenhum navegador consegue abrir, nem na sua própria
 * máquina: `0.0.0.0` e `[::]` querem dizer "escute em todas as interfaces".
 * São endereço de escuta, não endereço de visita — `localhost` é o de visita.
 */
const ENDERECO_NAO_NAVEGAVEL = /^https?:\/\/(0\.0\.0\.0|\[::\])(:|\/|$)/i;

/* As duas constantes acima vêm ANTES de SITE_URL de propósito: `const` não é
   içado como `function`, e lê-las durante a inicialização do módulo derruba
   o processo inteiro com "Cannot access before initialization". */

/**
 * O endereço público do site.
 *
 * Ele VAZA PRA FORA: vira o link que o cliente recebe no WhatsApp, o destino
 * do link curto da peça, o sitemap e os metadados. Por isso o padrão é o
 * domínio real, e por isso a normalização abaixo é mais desconfiada do que
 * parece necessário.
 */
export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? DOMINIO,
);

/**
 * Garante que o endereço saia com esquema, sem barra no fim — e que não seja
 * um endereço local.
 *
 * A variável é digitada à mão no painel da hospedagem, e cada forma errada
 * quebra uma coisa diferente. Sem `https://` o endereço deixa de ser um link
 * de verdade (o WhatsApp não linka domínio pelado). Com barra no fim, tudo
 * que concatena um caminho vira `//caminho`.
 *
 * E a terceira, que já derrubou isto DUAS vezes: um endereço local. Primeiro
 * `localhost:3000`, que foi parar na mensagem do WhatsApp do cliente; depois
 * `0.0.0.0:3000`, que o painel da Hostinger recebeu e que mandou quem clicava
 * no link da bolsa pra um endereço inexistente. Em produção isso agora é
 * ignorado em favor do domínio real: um endereço que só existe dentro do
 * servidor nunca pode virar o link que sai dele.
 *
 * Em desenvolvimento continua valendo — é lá que `localhost` é o certo.
 */
function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  const comEsquema = /^https?:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  // Antes de qualquer coisa: `0.0.0.0` não é endereço de visita em lugar
  // nenhum, nem em desenvolvimento. Trocar pelo `localhost` da mesma porta
  // devolve o endereço que a pessoa de fato consegue abrir, e tira este caso
  // da frente antes de a regra de ambiente abaixo poder deixá-lo passar.
  if (ENDERECO_NAO_NAVEGAVEL.test(comEsquema)) {
    const navegavel = comEsquema.replace(/^(https?:\/\/)(0\.0\.0\.0|\[::\])/i, '$1localhost');
    if (process.env.NODE_ENV === 'development') return navegavel;
    console.warn(
      `[seo] NEXT_PUBLIC_SITE_URL é um endereço de escuta (${comEsquema}), que navegador nenhum abre; usando ${DOMINIO}. Corrija a variável na hospedagem.`,
    );
    return DOMINIO;
  }

  // A condição é "não é desenvolvimento", e não "é produção": se NODE_ENV
  // vier vazio — e num painel de hospedagem isso acontece — o certo é
  // proteger, não deixar passar.
  if (process.env.NODE_ENV !== 'development' && ENDERECO_LOCAL.test(comEsquema)) {
    console.warn(
      `[seo] NEXT_PUBLIC_SITE_URL aponta pra um endereço local (${comEsquema}); usando ${DOMINIO}. Corrija a variável na hospedagem.`,
    );
    return DOMINIO;
  }
  return comEsquema;
}

export const SITE_NAME = 'Uni Bolsas';
