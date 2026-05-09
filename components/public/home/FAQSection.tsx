'use client';

import { useState } from 'react';
import { Reveal } from '@/components/public/primitives/Reveal';
import { PlusIcon } from '@/components/public/icons';
import { FAQ } from '@/lib/content/faq';

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <section className="uni-faq uni-section" id="faq">
      <div className="uni-container">
        <Reveal>
          <div className="uni-section-head">
            <div className="uni-eyebrow uni-eyebrow-wide">
              Perguntas que recebemos
            </div>
            <h2 className="uni-h2">
              Resp<em>o</em>stas curtas.
            </h2>
          </div>
        </Reveal>
        <div className="uni-faq-list">
          {FAQ.map((item, i) => {
            const open = openIdx === i;
            return (
              <Reveal key={i} delay={i * 40}>
                <div className={'uni-faq-item ' + (open ? 'is-open' : '')}>
                  <button
                    className="uni-faq-q"
                    onClick={() => setOpenIdx(open ? -1 : i)}
                    aria-expanded={open}
                  >
                    <span>{item.q}</span>
                    <span className="uni-faq-q-icon">
                      <PlusIcon size={14} rotated={open} />
                    </span>
                  </button>
                  <div className="uni-faq-a">{item.a}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
