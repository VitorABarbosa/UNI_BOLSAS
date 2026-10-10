import { NextResponse } from 'next/server';
import { SITE_URL } from './seo';

/**
 * Redireciona para um caminho do site usando o endereço PÚBLICO.
 *
 * POR QUE NÃO `new URL(caminho, request.url)`, que é o jeito que a
 * documentação mostra: `request.url` é o endereço por onde a requisição
 * chegou ao processo Node — e, atrás de um proxy reverso (a Hostinger põe o
 * LiteSpeed na frente), isso é o endereço INTERNO. O cliente clicava no link
 * curto da bolsa e era mandado pra `http://localhost:3200/produtos/...`, que
 * no navegador dele não existe.
 *
 * `SITE_URL` não depende de cabeçalho nenhum: é o endereço público, o mesmo
 * que a mensagem do WhatsApp usa pra montar o link. Usando a mesma constante
 * nos dois lados, o link e o destino não têm como discordar.
 */
export function redirectToSite(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, SITE_URL));
}
