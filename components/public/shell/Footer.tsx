import Link from 'next/link';
import { Logo } from '@/components/public/primitives/Logo';
import {
  HeartIcon,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/public/icons';
import { STORE } from '@/lib/content/store';
import { INSTAGRAM_HANDLE, TOKENS } from '@/lib/tokens';
import { waGeneral, waLink } from '@/lib/whatsapp';
import { CookiePrefsButton } from '@/components/public/shell/CookieConsent';
import { WaLink } from '@/components/public/primitives/WaLink';

export function Footer() {
  return (
    <footer className="uni-footer">
      <div className="uni-container">
        <div className="uni-footer-grid">
          <div>
            <Logo size={28} color={TOKENS.bone} />
            <p className="uni-footer-blurb">
              Bolsas, mochilas e malas no atacado, a partir de 3 peças, direto
              do nosso stand no Shopping 900, Brás · SP.{' '}
              <span style={{ color: TOKENS.caramel }}>
                Há mais de 25 anos no Brás.
              </span>
            </p>
          </div>
          <div>
            <div className="uni-footer-head">Catálogo</div>
            <div className="uni-footer-list">
              <Link href="/#catalogo" className="uni-footer-link">
                Bolsas
              </Link>
              <Link href="/#catalogo" className="uni-footer-link">
                Mochilas
              </Link>
              <Link href="/#catalogo" className="uni-footer-link">
                Esportivas
              </Link>
              <Link href="/#catalogo" className="uni-footer-link">
                Kits
              </Link>
              <Link href="/catalogo" className="uni-footer-link">
                Catálogo em PDF
              </Link>
            </div>
          </div>
          <div>
            <div className="uni-footer-head">Loja física</div>
            <div className="uni-footer-store">
              {STORE.name} · {STORE.unit}
              <br />
              {STORE.street}
              <br />
              {STORE.district} · {STORE.city}
              <br />
              <span className="uni-footer-hours">
                {STORE.hoursShort.map((line, i) => (
                  <span key={line}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </span>
            </div>
          </div>
          <div>
            <div className="uni-footer-head">Fale com a gente</div>
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
              <a
                href={waLink(
                  'Olá! Tenho interesse em trabalhar com vocês — vim pelo site.',
                )}
                className="uni-footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <HeartIcon size={12} color={TOKENS.caramel} /> Trabalhe conosco
              </a>
            </div>
          </div>
        </div>
        <div className="uni-footer-bottom">
          <span>
            © 2026 {STORE.razaoSocial} · CNPJ {STORE.cnpj}
          </span>
          {/* Privacidade e revogação ficam no rodapé de todas as páginas: a
              LGPD (art. 8º, §5º) pede que desfazer o aceite seja tão fácil
              quanto foi aceitar. */}
          <span className="uni-footer-legal">
            <Link href="/termos" className="uni-footer-link">
              Termos de compra
            </Link>
            <Link href="/trocas" className="uni-footer-link">
              Trocas
            </Link>
            <Link href="/privacidade" className="uni-footer-link">
              Privacidade
            </Link>
            <CookiePrefsButton className="uni-footer-link uni-footer-linkbtn" />
          </span>
          <span>Feito com cuidado em São Paulo · Brás</span>
        </div>
      </div>
    </footer>
  );
}
