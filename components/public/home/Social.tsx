import { Reveal } from '@/components/public/primitives/Reveal';
import { TESTIMONIALS } from '@/lib/content/testimonials';

export function Social() {
  return (
    <section className="uni-social uni-section" id="social">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">
              Quem compra com a gente
            </div>
            <h2 className="uni-h2">
              Na <em>voz</em> de quem usa.
            </h2>
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
