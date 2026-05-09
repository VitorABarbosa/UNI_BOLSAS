'use client';

import { useState, type FormEvent } from 'react';
import { ArrowIcon } from '@/components/public/icons';
import { waNewsletter } from '@/lib/whatsapp';

type NewsletterType = 'wholesale' | 'retail';

export function Newsletter() {
  const [type, setType] = useState<NewsletterType>('retail');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.open(
      waNewsletter(type, phone),
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <section className="uni-newsletter">
      <div className="uni-container">
        <div className="uni-news-inner">
          <div>
            <h2 className="uni-news-h">
              Receba <em>lançamentos</em> antes.
            </h2>
            <p className="uni-news-sub">
              Avisamos pelo WhatsApp quando o mix vira — sem flood, sem
              corrente, sem lista de transmissão. Escolha o seu canal e a gente
              segmenta.
            </p>
          </div>
          <form className="uni-news-form" onSubmit={handleSubmit}>
            <div
              className="uni-news-toggle"
              role="tablist"
              aria-label="Tipo de cadastro"
            >
              <button
                type="button"
                role="tab"
                aria-selected={type === 'wholesale'}
                className={
                  'uni-news-toggle-btn ' +
                  (type === 'wholesale' ? 'is-active' : '')
                }
                onClick={() => setType('wholesale')}
              >
                Sou lojista
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={type === 'retail'}
                className={
                  'uni-news-toggle-btn ' +
                  (type === 'retail' ? 'is-active' : '')
                }
                onClick={() => setType('retail')}
              >
                Cliente final
              </button>
            </div>
            <div className="uni-news-input-row">
              <input
                type="tel"
                inputMode="tel"
                className="uni-news-input"
                placeholder="(11) 9 0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-label="Seu WhatsApp"
              />
              <button type="submit" className="uni-news-submit">
                Quero receber <ArrowIcon size={12} />
              </button>
            </div>
            <span className="uni-news-tip">
              Abre o WhatsApp pra confirmar · não criamos cadastro automático.
            </span>
          </form>
        </div>
      </div>
    </section>
  );
}
