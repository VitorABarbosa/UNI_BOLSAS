'use client';

import { Reveal } from '@/components/public/primitives/Reveal';
import { CountUp } from '@/components/public/primitives/CountUp';

export function CredibilityStrip() {
  return (
    <section className="uni-cred" aria-label="Credenciais">
      <div className="uni-container">
        <div className="uni-cred-grid">
          <Reveal className="uni-cred-cell" delay={0}>
            <div className="uni-cred-num">
              +<CountUp value={10} />
              <span className="mono-suffix">anos</span>
            </div>
            <div className="uni-cred-label">no Brás</div>
          </Reveal>
          <Reveal className="uni-cred-cell" delay={120}>
            <div className="uni-cred-num">
              +<CountUp value={500} />
            </div>
            <div className="uni-cred-label">Modelos no catálogo</div>
          </Reveal>
          <Reveal className="uni-cred-cell" delay={240}>
            <div className="uni-cred-num">
              +<CountUp value={5000} />
            </div>
            <div className="uni-cred-label">Lojistas atendidas</div>
          </Reveal>
          <Reveal className="uni-cred-cell" delay={360}>
            <div className="uni-cred-num">2</div>
            <div className="uni-cred-label">Atacado · Varejo · Loja física</div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
