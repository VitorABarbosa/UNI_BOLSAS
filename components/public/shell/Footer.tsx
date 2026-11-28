import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ClockIcon, InstagramIcon, PinIcon, WhatsAppIcon } from '@/components/public/icons';
import { STORE } from '@/lib/content/store';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';
import { INSTAGRAM_HANDLE, WHATSAPP_NUMBER } from '@/lib/tokens';
import { waGeneral } from '@/lib/whatsapp';
import { CookiePrefsButton } from '@/components/public/shell/CookieConsent';
import { WaLink } from '@/components/public/primitives/WaLink';
import { LojaAberta } from '@/components/public/shell/LojaAberta';

/** 5511988063432 → (11) 98806-3432 */
const telefone = (n: string) => {
  const d = n.replace(/^55/, '');
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/** QR do WhatsApp, desenhado no servidor (SVG puro, nada pra baixar). */
async function qrDoWhatsApp(): Promise<string | null> {
  try {
    return await QRCode.toString(waGeneral, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#21170F', light: '#0000' } });
  } catch {
    return null;
  }
}

/**
 * O rodapé é um cartão de visita: frente café com a marca, verso creme com
 * endereço, horário (aberto/fechado ao vivo), WhatsApp, Instagram e site,
 * e um QR pra quem está no computador chamar pelo celular. Embaixo, só uma
 * linha de links e os dados da empresa.
 */
export async function Footer() {
  const qr = await qrDoWhatsApp();
  const [loja, corredor] = STORE.unit.split(' · ');
  return (
    <footer className="uni-footer uni-cv">
      <div className="uni-container">
        <div className="uni-cv-mesa">
          <article className="uni-cv-cartao" aria-label="Cartão de visita da Uni Bolsas">
            <div className="uni-cv-frente">
              <span className="uni-cv-moldura" aria-hidden="true" />
              <Image src="/LOGO_UNI_BOLSAS_PNG.png" alt="" width={56} height={56} className="uni-cv-logo" />
              <p className="uni-cv-nome">Uni Bolsas</p>
              <p className="uni-cv-ramo">Atacado de bolsas</p>
              <p className="uni-cv-desde">Há mais de 25 anos no Brás</p>
            </div>

            <div className="uni-cv-verso">
              <p className="uni-cv-ey">Atacado · a partir de {PEDIDO_MINIMO} peças</p>
              <ul className="uni-cv-dados">
                <li>
                  <PinIcon size={15} />
                  <span>
                    <strong>
                      {STORE.name} · {loja} · {corredor}
                    </strong>
                    {STORE.street}
                    <br />
                    {STORE.district}, {STORE.city}
                  </span>
                </li>
                <li>
                  <ClockIcon size={15} />
                  <span>
                    {STORE.hoursShort.join(' · ')}
                    <LojaAberta className="uni-cv-status" />
                  </span>
                </li>
                <li>
                  <WhatsAppIcon size={15} />
                  <WaLink href={waGeneral}>{telefone(WHATSAPP_NUMBER)}</WaLink>
                </li>
                <li>
                  <InstagramIcon size={15} />
                  <a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noopener noreferrer">
                    @{INSTAGRAM_HANDLE}
                  </a>
                </li>
              </ul>
              <div className="uni-cv-acoes">
                <WaLink href={waGeneral} className="uni-cv-btn is-cheio">
                  <WhatsAppIcon size={15} /> Chamar
                </WaLink>
                <a href={STORE.directionsUrl} target="_blank" rel="noopener noreferrer" className="uni-cv-btn">
                  <PinIcon size={14} /> Como chegar
                </a>
              </div>
              {qr && (
                <div className="uni-cv-qr" aria-hidden="true">
                  <span dangerouslySetInnerHTML={{ __html: qr }} />
                  <small>Aponte a câmera e chame no WhatsApp</small>
                </div>
              )}
            </div>
          </article>
        </div>

        <nav className="uni-cv-links" aria-label="Mapa do site">
          <Link href="/#catalogo">Catálogo</Link>
          <Link href="/#lookbook">Lookbook</Link>
          <Link href="/#atacado">Como comprar</Link>
          <Link href="/#faq">Dúvidas</Link>
          <Link href="/catalogo">Catálogo em PDF</Link>
          {COMPRA_NO_SITE && <Link href="/conta">Minha conta</Link>}
        </nav>

        <div className="uni-cv-base">
          <span>
            © {new Date().getFullYear()} {STORE.razaoSocial} · CNPJ {STORE.cnpj}
            {STORE.inscricaoEstadual ? ` · IE ${STORE.inscricaoEstadual}` : ''}
          </span>
          {/* Privacidade e revogação ficam no rodapé de todas as páginas: a
              LGPD (art. 8º, §5º) pede que desfazer o aceite seja tão fácil
              quanto foi aceitar. */}
          <span className="uni-cv-legal">
            <Link href="/termos">Termos</Link>
            <Link href="/trocas">Trocas</Link>
            <Link href="/privacidade">Privacidade</Link>
            <CookiePrefsButton className="uni-cv-linkbtn" />
          </span>
        </div>
      </div>
    </footer>
  );
}
