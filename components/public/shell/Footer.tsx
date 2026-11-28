import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/public/primitives/Logo';
import { ArrowIcon, HeartIcon, InstagramIcon, PinIcon, WhatsAppIcon } from '@/components/public/icons';
import { STORE } from '@/lib/content/store';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import { INSTAGRAM_HANDLE } from '@/lib/tokens';
import { waGeneral, waLink } from '@/lib/whatsapp';
import { CookiePrefsButton } from '@/components/public/shell/CookieConsent';
import { WaLink } from '@/components/public/primitives/WaLink';
import { LojaAberta } from '@/components/public/shell/LojaAberta';

/** As três bolsas do leque (fotos de estúdio do lookbook). */
const LEQUE = [
  { src: '/lookbook/bolsa-04.webp', alt: 'Bolsa de ombro caramelo' },
  { src: '/lookbook/bolsa-01.webp', alt: 'Bolsa de verniz vermelha' },
  { src: '/lookbook/bolsa-07.webp', alt: 'Bolsa de viagem roxa' },
];

const FAIXA = [
  `Atacado a partir de ${PEDIDO_MINIMO} peças`,
  'Pix, cartão e boleto',
  'Nota fiscal em todo pedido',
  'Envio para todo o Brasil',
  'Retire grátis no Brás',
  'Há mais de 25 anos no Brás',
];

/**
 * Rodapé "vitrine": um cartão escuro com a chamada de compra e três bolsas
 * em leque, as colunas do site, a loja física com o selo de aberto/fechado
 * e uma faixa correndo com o que dá segurança pra comprar.
 */
export function Footer() {
  return (
    <footer className="uni-footer uni-ft">
      <div className="uni-container">
        <section className="uni-ft-card" aria-label="Comprar no atacado">
          <div className="uni-ft-leque" aria-hidden="true">
            {LEQUE.map((f) => (
              <span key={f.src} className="uni-ft-foto">
                <Image src={f.src} alt="" fill sizes="(max-width: 700px) 120px, 220px" />
              </span>
            ))}
          </div>
          <div className="uni-ft-chamada">
            <p className="uni-ft-ey">Atacado · a partir de {PEDIDO_MINIMO} peças</p>
            <h2 className="uni-ft-titulo">
              Sua loja abastecida, <em>direto do Brás.</em>
            </h2>
            <p className="uni-ft-sub">
              Preço de fábrica, nota fiscal e envio para todo o Brasil. Ou retire grátis no {STORE.name}.
            </p>
            <div className="uni-ft-acoes">
              <Link href="/#catalogo" className="uni-ft-btn is-cheio">
                {COMPRA_NO_SITE ? 'Comprar pelo site' : 'Ver o catálogo'}
                <ArrowIcon size={15} />
              </Link>
              <WaLink href={waGeneral} className="uni-ft-btn">
                <WhatsAppIcon size={16} /> Chamar no WhatsApp
              </WaLink>
            </div>
            <dl className="uni-ft-numeros">
              <div>
                <dt>+25</dt>
                <dd>anos no Brás</dd>
              </div>
              <div>
                <dt>{PEDIDO_MINIMO}</dt>
                <dd>peças de mínimo</dd>
              </div>
              <div>
                <dt>1 dia</dt>
                <dd>útil pra separar</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="uni-ft-grade">
          <div className="uni-ft-marca">
            <Logo size={24} />
            <p>Bolsas, mochilas e esportivas no atacado, com preço de fábrica. Direto do nosso stand no {STORE.name}.</p>
            <div className="uni-ft-redes">
              <a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noopener noreferrer" aria-label={`Instagram @${INSTAGRAM_HANDLE}`}>
                <InstagramIcon size={18} />
              </a>
              <WaLink href={waGeneral} ariaLabel="WhatsApp">
                <WhatsAppIcon size={18} />
              </WaLink>
            </div>
          </div>

          <nav className="uni-ft-col" aria-label="Comprar">
            <p className="uni-ft-cab">Comprar</p>
            <Link href="/#catalogo">Catálogo</Link>
            <Link href="/#lookbook">Lookbook</Link>
            <Link href="/#atacado">Como comprar</Link>
            <Link href="/catalogo">Catálogo em PDF</Link>
            {COMPRA_NO_SITE && <Link href="/conta">Minha conta</Link>}
          </nav>

          <nav className="uni-ft-col" aria-label="Atendimento">
            <p className="uni-ft-cab">Atendimento</p>
            <WaLink href={waGeneral}>WhatsApp</WaLink>
            <a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <Link href="/#faq">Dúvidas</Link>
            <Link href="/trocas">Trocas e devoluções</Link>
            <a href={waLink('Olá! Tenho interesse em trabalhar com vocês — vim pelo site.')} target="_blank" rel="noopener noreferrer">
              Trabalhe conosco <HeartIcon size={11} />
            </a>
          </nav>

          <div className="uni-ft-loja">
            <div className="uni-ft-loja-topo">
              <p className="uni-ft-cab">Loja física</p>
              <LojaAberta />
            </div>
            <p className="uni-ft-loja-nome">
              {STORE.name} · {STORE.unit.split(' · ')[0]}
            </p>
            <p className="uni-ft-loja-end">
              {STORE.street}
              <br />
              {STORE.unit.split(' · ')[1] ?? ''} · {STORE.district}, {STORE.city}
            </p>
            <p className="uni-ft-loja-hor">{STORE.hoursShort.join('  ·  ')}</p>
            <a href={STORE.directionsUrl} target="_blank" rel="noopener noreferrer" className="uni-ft-rota">
              <PinIcon size={14} /> Como chegar
            </a>
          </div>
        </div>
      </div>

      <div className="uni-ft-faixa" aria-label="Compra segura">
        <div className="uni-ft-faixa-trilho">
          {[0, 1].map((k) => (
            <span key={k} aria-hidden={k === 1 || undefined}>
              {FAIXA.map((t) => (
                <span key={t}>
                  {t}
                  <b>✦</b>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="uni-container">
        <div className="uni-ft-base">
          <span>
            © {new Date().getFullYear()} {STORE.razaoSocial} · CNPJ {STORE.cnpj}
            {STORE.inscricaoEstadual ? ` · IE ${STORE.inscricaoEstadual}` : ''}
          </span>
          {/* Privacidade e revogação ficam no rodapé de todas as páginas: a
              LGPD (art. 8º, §5º) pede que desfazer o aceite seja tão fácil
              quanto foi aceitar. */}
          <span className="uni-ft-legal">
            <Link href="/termos">Termos</Link>
            <Link href="/trocas">Trocas</Link>
            <Link href="/privacidade">Privacidade</Link>
            <CookiePrefsButton className="uni-ft-linkbtn" />
          </span>
        </div>
      </div>
    </footer>
  );
}
