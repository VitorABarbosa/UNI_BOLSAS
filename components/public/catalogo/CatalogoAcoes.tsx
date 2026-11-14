'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SITE_URL } from '@/lib/seo';

type Categoria = { slug: string; label: string };

/** Monta o endereço do catálogo com as escolhas atuais. */
function endereco(comPrecos: boolean, categoria: string): string {
  const q = new URLSearchParams();
  if (!comPrecos) q.set('precos', 'nao');
  if (categoria) q.set('categoria', categoria);
  const s = q.toString();
  return `/catalogo${s ? `?${s}` : ''}`;
}

/**
 * Espera as fotos que ainda não carregaram. Sem isto, o PDF saía com
 * quadrados vazios no lugar das peças lá de baixo, que o navegador ainda não
 * tinha baixado (as fotos carregam sob demanda, conforme a rolagem).
 */
async function carregarFotos(): Promise<void> {
  const imgs = Array.from(
    document.querySelectorAll<HTMLImageElement>('.uni-cat-doc img'),
  );
  imgs.forEach((img) => {
    img.loading = 'eager';
  });
  await Promise.race([
    Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((ok) => {
              img.addEventListener('load', () => ok(), { once: true });
              img.addEventListener('error', () => ok(), { once: true });
            }),
      ),
    ),
    // Teto: uma foto que nunca chega não pode travar o botão.
    new Promise<void>((ok) => setTimeout(ok, 15000)),
  ]);
}

/**
 * Barra de ações do catálogo — não sai no PDF (CSS de impressão).
 *
 * Os modos (com/sem preço, categoria) mudam o endereço e a página é montada
 * de novo no servidor: o link copiado é sempre o que está na tela.
 */
export function CatalogoAcoes({
  comPrecos,
  categoria,
  categorias,
}: {
  comPrecos: boolean;
  categoria: string;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [aviso, setAviso] = useState('');
  const [preparando, setPreparando] = useState(false);

  const ir = (precos: boolean, cat: string) =>
    router.replace(endereco(precos, cat), { scroll: false });

  const compartilhar = async () => {
    const url = SITE_URL + endereco(comPrecos, categoria);
    const titulo = 'Catálogo Uni Bolsas';
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setAviso('Link copiado');
    } catch (err) {
      // Fechar a janela de compartilhar não é erro.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setAviso(url);
    }
    setTimeout(() => setAviso(''), 4000);
  };

  const salvarPdf = async () => {
    setPreparando(true);
    await carregarFotos();
    setPreparando(false);
    window.print();
  };

  return (
    <div className="uni-cat-doc-acoes">
      {/* Sem preços, a página é da cliente final da lojista: nada aqui pode
          levar de volta aos preços. Quem montou volta pelo navegador. */}
      {comPrecos && (
        <div className="uni-cat-doc-modos">
          <label className="uni-cat-doc-select">
            <span>Categoria</span>
            <select
              value={categoria}
              onChange={(e) => ir(comPrecos, e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="uni-cat-doc-revenda"
            onClick={() => ir(false, categoria)}
          >
            Versão sem preços, pras suas clientes
          </button>
        </div>
      )}
      <div className="uni-cat-doc-botoes">
        <button type="button" className="uni-cat-doc-btn" onClick={compartilhar}>
          Compartilhar link
        </button>
        <button
          type="button"
          className="uni-cat-doc-btn is-dark"
          onClick={salvarPdf}
          disabled={preparando}
        >
          {preparando ? 'Preparando fotos…' : 'Salvar em PDF'}
        </button>
      </div>
      {aviso && (
        <p className="uni-cat-doc-nota" role="status">
          {aviso}
        </p>
      )}
    </div>
  );
}
