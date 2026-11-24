import type { ReactNode } from 'react';

/** Moldura das telas de conta: título, linha de apoio e o formulário. */
export function Caixa({
  rotulo,
  titulo,
  sub,
  largo,
  children,
}: {
  rotulo: string;
  titulo: ReactNode;
  sub?: ReactNode;
  largo?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="uni-conta uni-section">
      <div className={'uni-conta-caixa' + (largo ? ' is-larga' : '')}>
        <div className="uni-eyebrow uni-eyebrow-wide">{rotulo}</div>
        <h1 className="uni-conta-titulo">{titulo}</h1>
        {sub && <p className="uni-conta-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
