import { Reveal } from '@/components/public/primitives/Reveal';
import { InstagramIcon } from '@/components/public/icons';
import { IG_FEED } from '@/lib/content/instagram';
import { TESTIMONIALS } from '@/lib/content/testimonials';
import { INSTAGRAM_HANDLE, TOKENS } from '@/lib/tokens';

export function Social() {
  return (
    <section className="uni-social" id="social">
      <div className="uni-container">
        <Reveal>
          <div className="uni-social-head">
            <div>
              <div className="uni-eyebrow uni-eyebrow-wide">Visto por aí</div>
              <h2 className="uni-h2">
                No <em>feed</em> e na rua.
              </h2>
            </div>
            <a
              className="uni-social-handle"
              href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon size={16} />@{INSTAGRAM_HANDLE}
            </a>
          </div>
        </Reveal>
        <Reveal>
          <div className="uni-ig-grid">
            {IG_FEED.map((post, i) => (
              <a
                key={post.shortcode}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="uni-ig-item"
                aria-label={`Post ${i + 1} de @${INSTAGRAM_HANDLE} no Instagram`}
              >
                <img
                  src={`/instagram/${post.shortcode}.jpg`}
                  alt=""
                  loading="lazy"
                />
                <div className="uni-ig-overlay">
                  <InstagramIcon size={28} color={TOKENS.bone} />
                </div>
              </a>
            ))}
          </div>
        </Reveal>
        <div className="uni-test-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="uni-test-card">
                <blockquote className="uni-test-quote">{t.quote}</blockquote>
                <figcaption>
                  <div className="uni-test-name">{t.name}</div>
                  <div className="uni-test-role">{t.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
