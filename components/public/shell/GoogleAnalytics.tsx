'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useConsent } from '@/hooks/useConsent';
import { GA_ID } from '@/lib/analytics/google';

/**
 * Google Analytics, atrás do consentimento.
 *
 * O GA é um serviço do Google: quando carrega, o Google recebe o IP, o
 * aparelho e a página de quem visita, e grava cookies próprios. Isso é
 * tratamento de dado pessoal por terceiro e, pela LGPD, depende de
 * consentimento (art. 7º, I) — não cabe no legítimo interesse que sustenta a
 * contagem agregada que o site faz por conta própria.
 *
 * Por isso o script não existe na página até a pessoa aceitar. Não é o GA
 * carregado "em modo restrito": é o GA ausente. Quem escolhe "só o essencial"
 * nunca é apresentado ao Google.
 *
 * E se ela mudar de ideia depois de ter aceitado, o efeito abaixo desliga a
 * biblioteca que já está na memória e apaga os cookies que ela criou —
 * desmontar o <Script> sozinho não faria nem uma coisa nem outra.
 */
export function GoogleAnalytics() {
  const consent = useConsent();
  const pathname = usePathname();
  const permitido = consent === 'all' && GA_ID !== '';

  useEffect(() => {
    if (permitido || !GA_ID) return;
    // A chave que o próprio GA consulta antes de mandar qualquer coisa.
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true;
    // Os cookies do GA (_ga e _ga_<id>) sobrevivem ao script; sem isto, quem
    // revoga continua carregando o identificador do Google no navegador.
    for (const c of document.cookie.split('; ')) {
      const nome = c.split('=')[0];
      if (!nome || !nome.startsWith('_ga')) continue;
      for (const dominio of ['', `; domain=.${location.hostname}`]) {
        document.cookie = `${nome}=; max-age=0; path=/${dominio}`;
      }
    }
  }, [permitido]);

  /**
   * Página vista a cada troca de rota.
   *
   * O site é uma aplicação de página única: ir do catálogo pra uma peça não
   * recarrega nada, e o `gtag` só conta sozinho o primeiro carregamento. Sem
   * isto, o GA registraria uma visita por sessão em vez de uma por página.
   */
  useEffect(() => {
    if (!permitido || !pathname) return;
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [permitido, pathname]);

  if (!permitido) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
/* send_page_view desligado: quem manda a página vista é o efeito acima, pra
   não contar duas vezes a primeira e nenhuma vez as seguintes. */
gtag('config', '${GA_ID}', { send_page_view: false, anonymize_ip: true });`}
      </Script>
    </>
  );
}
