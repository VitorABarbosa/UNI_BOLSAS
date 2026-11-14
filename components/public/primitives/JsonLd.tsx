/**
 * Escreve dados estruturados na página.
 *
 * O `<` vira `<` porque um nome de peça com "</script>" fecharia a tag
 * no meio do JSON — e tudo depois dele viraria HTML.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
