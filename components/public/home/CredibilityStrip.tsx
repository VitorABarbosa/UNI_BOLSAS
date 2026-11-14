'use client';

import { Reveal } from '@/components/public/primitives/Reveal';
import { CountUp } from '@/components/public/primitives/CountUp';
import { PEDIDO_MINIMO } from '@/lib/content/atacado';

export function CredibilityStrip() {
  return (
    <section className="uni-cred" aria-label="Credenciais">
      <div className="uni-container">
        <div className="uni-cred-grid">
          <Reveal className="uni-cred-cell" delay={0}>
            <div className="uni-cred-num">
              +<CountUp value={25} />
              <span className="mono-suffix">anos</span>
            </div>
            <div className="uni-cred-label">no Brás</div>
          </Reveal>
          <Reveal className="uni-cred-cell" delay={120}>
            <div className="uni-cred-num">
              +<CountUp value={5000} />
            </div>
            <div className="uni-cred-label">Lojistas atendidas</div>
          </Reveal>
          <Reveal className="uni-cred-cell" delay={240}>
            <div className="uni-cred-num">
              {PEDIDO_MINIMO}
              <span className="mono-suffix">peças</span>
            </div>
            <div className="uni-cred-label">Pedido mínimo no atacado</div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
