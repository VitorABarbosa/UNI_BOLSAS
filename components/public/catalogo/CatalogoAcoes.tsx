'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SITE_URL } from '@/lib/seo';
import { gerarCatalogoPdf, type CatalogoPdf } from '@/lib/catalogo-pdf';

type Categoria = { slug: string; label: string };

/** Monta o endereço do catálogo com as escolhas atuais. */
function endereco(comPrecos: boolean, categoria: string): string {
  const q = new URLSearchParams();
  if (!comPrecos) q.set('precos', 'nao');
  if (categoria) q.set('categoria', categoria);
  const s = q.toString();
  return `/catalogo${s ? `?${s}` : ''}`;
}

/** Nome do arquivo: diz o que tem dentro, pra quem acha ele depois. */
function nomeArquivo(comPrecos: boolean, categoria: string): string {
  return ['catalogo-uni-bolsas', categoria, comPrecos ? '' : 'sem-precos']
    .filter(Boolean)
    .join('-') + '.pdf';
}

/**
 * Navegador embutido em app (Instagram, Facebook, WebView do Android): é
 * onde download costuma não funcionar. Só serve pra mostrar a dica de abrir
 * no navegador — nada é bloqueado por causa disso.
 */
function navegadorDeApp(): boolean {
  return /Instagram|FBAN|FBAV|FB_IAB|Line\/|; wv\)/i.test(navigator.userAgent);
}

type Pronto = { url: string; arquivo: File; podeEnviar: boolean };

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
  pdf,
}: {
  comPrecos: boolean;
  categoria: string;
  categorias: Categoria[];
  pdf: CatalogoPdf;
}) {
  const router = useRouter();
  const [aviso, setAviso] = useState('');
  const [andamento, setAndamento] = useState<string | null>(null);
  const [pronto, setPronto] = useState<Pronto | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [deApp, setDeApp] = useState(false);

  useEffect(() => {
    // Lido depois da hidratação: no servidor não existe navegador.
    const t = setTimeout(() => setDeApp(navegadorDeApp()), 0);
    return () => clearTimeout(t);
  }, []);

  // O PDF pronto é de um modo e de uma categoria; mudou, vale gerar de novo.
  useEffect(() => {
    return () => {
      if (pronto) URL.revokeObjectURL(pronto.url);
    };
  }, [pronto]);

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

  const baixarPdf = async () => {
    setFalhou(false);
    setPronto(null);
    setAndamento('Preparando o PDF…');
    try {
      const blob = await gerarCatalogoPdf(pdf, (feitas, total) => {
        setAndamento(
          total ? `Preparando o PDF… fotos ${feitas} de ${total}` : 'Preparando o PDF…',
        );
      });
      const nome = nomeArquivo(comPrecos, categoria);
      const arquivo = new File([blob], nome, { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const podeEnviar =
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [arquivo] });
      setPronto({ url, arquivo, podeEnviar });
      // Baixa direto. Se o navegador segurar o download (alguns celulares
      // seguram, porque o clique já foi há alguns segundos), os botões do
      // aviso abaixo fazem o mesmo com um toque novo.
      const a = document.createElement('a');
      a.href = url;
      a.download = nome;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setFalhou(true);
    } finally {
      setAndamento(null);
    }
  };

  const enviarPdf = async () => {
    if (!pronto) return;
    try {
      await navigator.share({ files: [pronto.arquivo], title: 'Catálogo Uni Bolsas' });
    } catch {
      /* fechou a janela de compartilhar: nada a fazer */
    }
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
          onClick={baixarPdf}
          disabled={andamento !== null}
        >
          {andamento ? 'Preparando…' : 'Baixar PDF'}
        </button>
      </div>
      {andamento && (
        <p className="uni-cat-doc-nota" role="status">
          {andamento}
        </p>
      )}
      {pronto && (
        <div className="uni-cat-doc-pronto" role="status">
          <span>PDF pronto: {pronto.arquivo.name}</span>
          <div className="uni-cat-doc-pronto-acoes">
            <a href={pronto.url} download={pronto.arquivo.name} className="uni-cat-doc-btn">
              Baixar de novo
            </a>
            {pronto.podeEnviar && (
              <button type="button" className="uni-cat-doc-btn is-dark" onClick={enviarPdf}>
                Enviar o PDF
              </button>
            )}
          </div>
        </div>
      )}
      {falhou && (
        <p className="uni-cat-doc-nota" role="alert">
          Não deu pra montar o PDF agora. Tente de novo em instantes; se
          continuar, use “Compartilhar link”.
        </p>
      )}
      {deApp && (
        <p className="uni-cat-doc-nota">
          Se o PDF não baixar, abra esta página no Chrome ou no Safari: menu
          ⋯ → Abrir no navegador.
        </p>
      )}
      {aviso && (
        <p className="uni-cat-doc-nota" role="status">
          {aviso}
        </p>
      )}
    </div>
  );
}
