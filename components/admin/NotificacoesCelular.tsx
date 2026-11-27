'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff, Share } from 'lucide-react';
import {
  ativarNotificacoes,
  chaveDasNotificacoes,
  desativarNotificacoes,
  testarNotificacao,
} from '@/app/admin/_actions/notificacoes';

type Situacao = 'carregando' | 'sem-suporte' | 'instalar-iphone' | 'bloqueado' | 'desligado' | 'ligado';

const base64ParaBytes = (b64: string) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalado = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

async function registro() {
  return navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin/' });
}

function nomeDoAparelho() {
  const ua = navigator.userAgent;
  if (/iphone/i.test(ua)) return 'iPhone';
  if (/ipad/i.test(ua)) return 'iPad';
  if (/android/i.test(ua)) return 'Android';
  if (/mac/i.test(ua)) return 'Mac';
  if (/windows/i.test(ua)) return 'Windows';
  return 'Navegador';
}

/**
 * Liga as notificações de venda NESTE aparelho. No iPhone, a Apple só deixa
 * depois de o painel ser adicionado à tela de início (e aberto por lá).
 */
export function NotificacoesCelular({ compacto = false }: { compacto?: boolean }) {
  const [sit, setSit] = useState<Situacao>('carregando');
  const [endpoint, setEndpoint] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [pendente, start] = useTransition();

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setSit(ehIphone() && !instalado() ? 'instalar-iphone' : 'sem-suporte');
        return;
      }
      if (ehIphone() && !instalado()) return setSit('instalar-iphone');
      if (Notification.permission === 'denied') return setSit('bloqueado');
      try {
        const r = await registro();
        const sub = await r.pushManager.getSubscription();
        if (sub) {
          setEndpoint(sub.endpoint);
          setSit('ligado');
        } else setSit('desligado');
      } catch {
        setSit('sem-suporte');
      }
    })();
  }, []);

  const ligar = () =>
    start(async () => {
      setMsg(null);
      try {
        const permissao = await Notification.requestPermission();
        if (permissao !== 'granted') {
          setSit(permissao === 'denied' ? 'bloqueado' : 'desligado');
          return;
        }
        const r = await registro();
        await navigator.serviceWorker.ready;
        const chave = await chaveDasNotificacoes();
        const sub =
          (await r.pushManager.getSubscription()) ??
          (await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ParaBytes(chave) }));
        const res = await ativarNotificacoes(sub.toJSON(), nomeDoAparelho());
        if (!res.ok) return setMsg(res.erro ?? 'Não deu certo. Tente de novo.');
        setEndpoint(sub.endpoint);
        setSit('ligado');
      } catch (e) {
        console.error(e);
        setMsg('Não deu certo neste navegador. Tente pelo Chrome (Android) ou pelo app na tela de início (iPhone).');
      }
    });

  const desligar = () =>
    start(async () => {
      const r = await registro();
      const sub = await r.pushManager.getSubscription();
      if (sub) {
        await desativarNotificacoes(sub.endpoint);
        await sub.unsubscribe();
      }
      setEndpoint('');
      setSit('desligado');
    });

  const testar = () =>
    start(async () => {
      const r = await testarNotificacao(endpoint);
      setMsg(r.ok ? 'Enviada! Deve aparecer em alguns segundos.' : 'Não chegou: desligue e ligue de novo.');
    });

  if (sit === 'carregando' || (compacto && sit === 'sem-suporte')) return null;

  const caixa = 'rounded-lg border bg-white p-4 text-sm';
  const btn = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60';

  if (sit === 'ligado') {
    return (
      <div className={compacto ? 'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500' : caixa}>
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
          <Bell className="h-4 w-4" /> Notificações ligadas neste aparelho
        </span>
        <button type="button" className="underline" onClick={testar} disabled={pendente}>
          Enviar teste
        </button>
        {!compacto && (
          <button type="button" className="underline" onClick={desligar} disabled={pendente}>
            Desligar
          </button>
        )}
        {msg && <span className="w-full text-stone-600">{msg}</span>}
      </div>
    );
  }

  return (
    <div className={caixa + ' border-leather/40 bg-[#FBF7F0]'}>
      <div className="mb-1 flex items-center gap-2 font-medium text-ink">
        <Bell className="h-4 w-4 text-leather" /> Receba as vendas no celular
      </div>
      {sit === 'instalar-iphone' ? (
        <ol className="list-decimal space-y-1 pl-5 text-stone-600">
          <li>
            No Safari, toque em <Share className="inline h-4 w-4 -translate-y-px" /> <strong>Compartilhar</strong>.
          </li>
          <li>
            Escolha <strong>Adicionar à Tela de Início</strong>.
          </li>
          <li>Abra o painel pelo ícone novo e toque em “Ativar notificações” aqui.</li>
        </ol>
      ) : sit === 'bloqueado' ? (
        <p className="text-stone-600">
          <BellOff className="mr-1 inline h-4 w-4" />
          As notificações deste site estão bloqueadas. Libere nas configurações do navegador (cadeado ao lado do
          endereço → Notificações → Permitir) e recarregue a página.
        </p>
      ) : sit === 'sem-suporte' ? (
        <p className="text-stone-600">Este navegador não recebe notificações. No celular, use o Chrome (Android) ou o Safari (iPhone).</p>
      ) : (
        <>
          <p className="mb-3 text-stone-600">
            Um aviso na tela a cada venda, quando um pedido travar e um resumo no fim do dia. Ative em cada celular que for
            acompanhar.
          </p>
          <button type="button" onClick={ligar} disabled={pendente} className={btn + ' bg-ink text-bone'}>
            <Bell className="h-4 w-4" /> {pendente ? 'Ativando…' : 'Ativar notificações'}
          </button>
        </>
      )}
      {msg && <p className="mt-2 text-red-700">{msg}</p>}
    </div>
  );
}
