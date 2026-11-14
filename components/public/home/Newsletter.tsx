'use client';

import { useState, type FormEvent } from 'react';
import { ArrowIcon } from '@/components/public/icons';
import { waNewsletter } from '@/lib/whatsapp';

export function Newsletter() {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.open(waNewsletter(phone), '_blank', 'noopener,noreferrer');
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
              Avisamos pelo WhatsApp quando o mix do atacado vira — sem flood,
              sem corrente, sem lista de transmissão.
            </p>
          </div>
          <form className="uni-news-form" onSubmit={handleSubmit}>
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
