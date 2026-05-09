import { Reveal } from '@/components/public/primitives/Reveal';
import { WhatsAppButton } from '@/components/public/primitives/WhatsAppButton';
import {
  ArrowIcon,
  ClockIcon,
  PinIcon,
  WazeIcon,
} from '@/components/public/icons';
import { MapIllustration } from './MapIllustration';
import { STORE } from '@/lib/content/store';
import { TOKENS } from '@/lib/tokens';
import { waLink } from '@/lib/whatsapp';

export function Location() {
  return (
    <section className="uni-location-section uni-section" id="visite">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">Visite a loja</div>
            <h2 className="uni-h2">
              Estamos <em>no Brás.</em>
            </h2>
            <p className="uni-section-lede">
              No coração comercial de São Paulo, no Shopping 900 — um
              quarteirão da Estação Brás.
            </p>
          </div>
        </Reveal>
        <div className="uni-location-grid">
          <Reveal>
            <div className="uni-map-wrap">
              <MapIllustration />
              <a
                className="uni-map-pill"
                href={STORE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PinIcon size={14} /> Abrir no Maps
              </a>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="uni-location-info">
              <div className="uni-location-tag">
                <PinIcon size={14} color={TOKENS.leatherDark} /> Endereço
              </div>
              <h3 className="uni-store-name">{STORE.name}</h3>
              <div className="uni-store-addr">
                {STORE.street}
                <br />
                {STORE.district} · {STORE.city}
                <div className="uni-store-cep">CEP {STORE.cep}</div>
              </div>
              <div className="uni-store-hours">
                <div className="uni-store-hours-head">
                  <ClockIcon size={12} color={TOKENS.leatherDark} /> Horário
                </div>
                <div className="uni-store-hours-body">{STORE.hours}</div>
              </div>
              <div className="uni-store-transport">
                <div className="uni-store-transport-head">Como chegar</div>
                {STORE.transport.map((t) => (
                  <div key={t.mode} className="uni-store-transport-row">
                    <strong>{t.mode}</strong>
                    <span>{t.time}</span>
                  </div>
                ))}
              </div>
              <div className="uni-location-ctas">
                <a
                  className="uni-loc-btn uni-loc-btn-dark"
                  href={STORE.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowIcon size={14} /> Como chegar
                </a>
                <a
                  className="uni-loc-btn uni-loc-btn-waze"
                  href={STORE.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WazeIcon size={16} /> Salvar no Waze
                </a>
                <WhatsAppButton
                  href={waLink(
                    'Olá! Quero confirmar atendimento na loja física do Shopping 900 hoje.',
                  )}
                  variant="outline"
                  full
                >
                  Confirmar atendimento
                </WhatsAppButton>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
