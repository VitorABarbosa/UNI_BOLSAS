import Link from 'next/link';
import { Logo } from '@/components/public/primitives/Logo';
import {
  ArrowIcon,
  ClockIcon,
  HeartIcon,
  InstagramIcon,
  PinIcon,
  WhatsAppIcon,
} from '@/components/public/icons';
import { STORE } from '@/lib/content/store';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import { INSTAGRAM_HANDLE } from '@/lib/tokens';
import { waGeneral, waLink } from '@/lib/whatsapp';
import { CookiePrefsButton } from '@/components/public/shell/CookieConsent';
import { WaLink } from '@/components/public/primitives/WaLink';

/**
 * Rodapé: uma chamada de compra, o mapa do site em colunas, a faixa do que
 * dá segurança pra comprar (pagamento, nota, envio) e os dados da empresa.
 * Fundo areia, no tom do resto do site — o preto pesava no fim da página.
 */
export function Footer() {
  return (
    <footer className="uni-footer">
      <div className="uni-container">
        <div className="uni-footer-cta">
          <div>
            <p className="uni-footer-eyebrow">Atacado · a partir de {PEDIDO_MINIMO} peças</p>
            <h2 className="uni-footer-title">
              Bolsas no atacado, <em>direto do Brás.</em>
            </h2>
          </div>
          <div className="uni-footer-cta-acoes">
            <Link href="/#catalogo" className="uni-footer-btn is-cheio">
              {COMPRA_NO_SITE ? 'Comprar pelo site' : 'Ver o catálogo'} <ArrowIcon size={14} />
            </Link>
            <WaLink href={waGeneral} className="uni-footer-btn">
              <WhatsAppIcon size={15} /> Falar no WhatsApp
            </WaLink>
          </div>
        </div>

        <div className="uni-footer-grid">
          <div className="uni-footer-marca">
            <Logo size={26} />
            <p className="uni-footer-blurb">
              Bolsas, mochilas e esportivas com preço de fábrica, direto do nosso stand no {STORE.name}.{' '}
              <strong>Há mais de 25 anos no Brás.</strong>
            </p>
            <div className="uni-footer-redes">
              <a
                href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram @${INSTAGRAM_HANDLE}`}
              >
                <InstagramIcon size={17} />
              </a>
              <WaLink href={waGeneral} ariaLabel="WhatsApp">
                <WhatsAppIcon size={17} />
              </WaLink>
            </div>
          </div>

          <nav aria-label="Comprar">
            <div className="uni-footer-head">Comprar</div>
            <div className="uni-footer-list">
              <Link href="/#catalogo" className="uni-footer-link">Catálogo</Link>
              <Link href="/#lookbook" className="uni-footer-link">Lookbook</Link>
              <Link href="/#atacado" className="uni-footer-link">Como comprar</Link>
              <Link href="/#faq" className="uni-footer-link">Dúvidas</Link>
              <Link href="/catalogo" className="uni-footer-link">Catálogo em PDF</Link>
              {COMPRA_NO_SITE && (
                <Link href="/conta" className="uni-footer-link">Minha conta</Link>
              )}
            </div>
          </nav>

          <div>
            <div className="uni-footer-head">Loja física</div>
            <div className="uni-footer-store">
              <p>
                <PinIcon size={14} />
                <span>
                  {STORE.name} · {STORE.unit}
                  <br />
                  {STORE.street}
                  <br />
                  {STORE.district} · {STORE.city}
                </span>
              </p>
              <p>
                <ClockIcon size={14} />
                <span>
                  {STORE.hoursShort.map((line, i) => (
                    <span key={line}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </span>
              </p>
              <a href={STORE.directionsUrl} target="_blank" rel="noopener noreferrer" className="uni-footer-link is-sublinhado">
                Como chegar
              </a>
            </div>
          </div>

          <div>
            <div className="uni-footer-head">Atendimento</div>
            <div className="uni-footer-list">
              <WaLink href={waGeneral} className="uni-footer-link">
                <WhatsAppIcon size={14} /> WhatsApp
              </WaLink>
              <a
                href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
                className="uni-footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon size={14} /> @{INSTAGRAM_HANDLE}
              </a>
              <Link href="/trocas" className="uni-footer-link">Trocas e devoluções</Link>
              <a
                href={waLink('Olá! Tenho interesse em trabalhar com vocês — vim pelo site.')}
                className="uni-footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <HeartIcon size={12} /> Trabalhe conosco
              </a>
            </div>
          </div>
        </div>

        {COMPRA_NO_SITE && (
        <ul className="uni-footer-selos" aria-label="Compra segura">
          <li>
            <strong>Pix, cartão ou boleto</strong>
            <span>Pagamento seguro pelo Mercado Pago</span>
          </li>
          <li>
            <strong>Nota fiscal</strong>
            <span>Em todo pedido, com CNPJ ou CPF</span>
          </li>
          <li>
            <strong>Envio para todo o Brasil</strong>
            <span>Ou retire grátis no Brás</span>
          </li>
        </ul>
        )}

        <div className="uni-footer-bottom">
          <span>
            © {new Date().getFullYear()} {STORE.razaoSocial} · CNPJ {STORE.cnpj}
            {STORE.inscricaoEstadual ? ` · IE ${STORE.inscricaoEstadual}` : ''}
          </span>
          {/* Privacidade e revogação ficam no rodapé de todas as páginas: a
              LGPD (art. 8º, §5º) pede que desfazer o aceite seja tão fácil
              quanto foi aceitar. */}
          <span className="uni-footer-legal">
            <Link href="/termos" className="uni-footer-link">Termos de compra</Link>
            <Link href="/trocas" className="uni-footer-link">Trocas</Link>
            <Link href="/privacidade" className="uni-footer-link">Privacidade</Link>
            <CookiePrefsButton className="uni-footer-link uni-footer-linkbtn" />
          </span>
        </div>
      </div>
    </footer>
  );
}
