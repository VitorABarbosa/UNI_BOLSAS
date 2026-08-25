import Image from 'next/image';
import { Reveal } from '@/components/public/primitives/Reveal';
import { InstagramIcon, PlayIcon } from '@/components/public/icons';
import { REELS, REEL_TEASERS } from '@/lib/content/reels';
import { INSTAGRAM_HANDLE } from '@/lib/tokens';

/**
 * "Spoiler do feed" — três Reels escolhidos a dedo, cada card levando pro
 * post no Instagram. Sem API da Meta, sem token que expira: as capas são
 * arquivos locais (lib/content/reels.ts), então a seção nunca derruba nada.
 */
const REEL_SIZES = '(max-width: 600px) 68vw, (max-width: 1080px) 31vw, 330px';

export function Reels() {
  return (
    <section className="uni-reels uni-section" id="reels">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">
              @{INSTAGRAM_HANDLE} no Instagram
            </div>
            <h2 className="uni-h2">
              Spoiler <em>do feed.</em>
            </h2>
            <p className="uni-section-lede">
              Um gostinho do que rola por lá — toca no card pra assistir o
              Reel inteiro.
            </p>
          </div>
        </Reveal>
        <div className="uni-reels-grid">
          {REELS.map((reel, i) => {
            const teaser = reel.cover == null;
            return (
              <Reveal key={reel.id} delay={i * 110}>
                <a
                  className="uni-reel-card"
                  href={reel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Assistir o Reel ${i + 1} no Instagram`}
                >
                  <div className="uni-reel-media">
                    <Image
                      src={
                        reel.cover ??
                        REEL_TEASERS[i % REEL_TEASERS.length] ??
                        '/hero/slide-1.jpg'
                      }
                      alt=""
                      fill
                      sizes={REEL_SIZES}
                      className={
                        'uni-reel-img' + (teaser ? ' is-teaser' : '')
                      }
                    />
                    <div className="uni-reel-shade" />
                    <span className="uni-reel-tag">
                      Reel {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="uni-reel-play">
                      <PlayIcon size={22} />
                    </span>
                    <span className="uni-reel-hint">
                      <InstagramIcon size={14} />
                      Assistir no Instagram
                    </span>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
        <Reveal>
          <div className="uni-reels-cta">
            <a
              href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="uni-reels-profile"
            >
              Ver o perfil completo · @{INSTAGRAM_HANDLE}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
