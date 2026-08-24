import { Logo } from '@/components/public/primitives/Logo';
import {
  HeartIcon,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/public/icons';
import { STORE } from '@/lib/content/store';
import { INSTAGRAM_HANDLE, TOKENS } from '@/lib/tokens';
import { waGeneral, waLink } from '@/lib/whatsapp';

export function Footer() {
  return (
    <footer className="uni-footer">
      <div className="uni-container">
        <div className="uni-footer-grid">
          <div>
            <Logo size={28} color={TOKENS.bone} />
            <p className="uni-footer-blurb">
              Bolsas, mochilas e malas. Atacado e varejo direto do nosso stand
              no Shopping 900, Brás · SP.{' '}
              <span style={{ color: TOKENS.caramel }}>
                Há mais de 25 anos no Brás.
              </span>
            </p>
          </div>
          <div>
            <div className="uni-footer-head">Catálogo</div>
            <div className="uni-footer-list">
              <a href="#catalogo" className="uni-footer-link">
                Bolsas
              </a>
              <a href="#catalogo" className="uni-footer-link">
                Mochilas
              </a>
              <a href="#catalogo" className="uni-footer-link">
                Esportivas
              </a>
              <a href="#catalogo" className="uni-footer-link">
                Kits
              </a>
            </div>
          </div>
          <div>
            <div className="uni-footer-head">Loja física</div>
            <div className="uni-footer-store">
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
              <a
                href={waGeneral}
                className="uni-footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon size={14} /> WhatsApp
              </a>
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
          <span>© 2026 Uni Bolsas · CNPJ {STORE.cnpj}</span>
          <span>Feito com cuidado em São Paulo · Brás</span>
        </div>
      </div>
    </footer>
  );
}
