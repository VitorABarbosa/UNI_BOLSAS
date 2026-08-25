export const STORE = {
  name: 'Shopping 900',
  street: 'Rua Monsenhor de Andrade, 900',
  district: 'Brás',
  city: 'São Paulo — SP',
  cep: '03009-100',
  hours: ['Seg-Ter · 4h às 12h', 'Qua-Sex · 5h às 11h'],
  hoursShort: ['Seg-Ter · 4h-12h', 'Qua-Sex · 5h-11h'],
  /* Vazio = a linha do CNPJ não aparece no rodapé. Preencher com o CNPJ real
     (formato 00.000.000/0001-00) pra ele voltar a ser exibido. */
  cnpj: '',
  transport: [
    { mode: 'Metrô Brás', time: '8 min' },
    { mode: 'CPTM Brás', time: '5 min' },
    { mode: 'Ônibus 100 · 270', time: 'porta' },
  ],
  lat: -23.5326,
  lng: -46.6126,
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Shopping+900+Rua+Monsenhor+de+Andrade+900+Br%C3%A1s+S%C3%A3o+Paulo',
  embedUrl:
    'https://maps.google.com/maps?q=Shopping+900+Rua+Monsenhor+de+Andrade+900+Br%C3%A1s+S%C3%A3o+Paulo&z=16&output=embed',
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Shopping+900+Rua+Monsenhor+de+Andrade+900+Br%C3%A1s+S%C3%A3o+Paulo',
  wazeUrl: 'https://waze.com/ul?ll=-23.5326,-46.6126&navigate=yes',
} as const;

export type StoreInfo = typeof STORE;
