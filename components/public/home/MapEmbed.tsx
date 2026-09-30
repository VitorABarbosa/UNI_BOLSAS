'use client';

import { useState } from 'react';
import { STORE } from '@/lib/content/store';
import { useConsent } from '@/hooks/useConsent';

/**
 * Mapa da loja — que só chama o Google depois de um sim.
 *
 * O `<iframe>` do Google Maps não é um desenho: ao carregar, ele entrega ao
 * Google o IP de quem visita, o aparelho e a página em que o mapa estava, e
 * grava cookies dele. Isso é tratamento de dado pessoal por terceiro, e antes
 * ele acontecia na primeira rolagem da home, sem ninguém ter concordado com
 * nada.
 *
 * Agora o lugar aparece como cartão estático — mesmo endereço, mesmos botões
 * de rota — e o mapa do Google entra quando a pessoa pede, ou direto se ela
 * já aceitou os cookies. Quem recusou continua com endereço, horário e
 * caminho: não perde nada de útil, só não é entregue ao Google sem saber.
 */
export function MapEmbed() {
  const consent = useConsent();
  const [asked, setAsked] = useState(false);
  // Quem aceitou os cookies vê o mapa direto. Quem só tocou no botão vê
  // enquanto não disser o contrário — trocar a escolha para "só o essencial"
  // tira o mapa da tela na hora, sem precisar recarregar.
  const load = consent === 'all' || (asked && consent !== 'essential');

  if (load) {
    return (
      <iframe
        title={`Mapa: ${STORE.name}, ${STORE.street}`}
        src={STORE.embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    );
  }

  return (
    <div className="uni-map-ask">
      <div className="uni-map-ask-inner">
        <p className="uni-map-ask-title">{STORE.name}</p>
        <p className="uni-map-ask-addr">
          {STORE.street}
          <br />
          {STORE.district} · {STORE.city}
        </p>
        <button
          type="button"
          className="uni-map-ask-btn"
          onClick={() => setAsked(true)}
        >
          Ver o mapa
        </button>
        <p className="uni-map-ask-note">
          O mapa é do Google — ao abrir, ele recebe seus dados de acesso.
        </p>
      </div>
    </div>
  );
}
