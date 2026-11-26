export const STORE = {
  name: 'Shopping 900',
  /* Onde fica a loja DENTRO do shopping. É o que a pessoa procura quando
     já está lá: sem isto, chegava no Shopping 900 e tinha que perguntar. */
  unit: 'Loja 312 · Corredor C',
  /** A mesma coisa, pra entrar no meio de uma frase. */
  unitText: 'loja 312, no corredor C',
  street: 'Rua Monsenhor de Andrade, 900',
  district: 'Brás',
  city: 'São Paulo — SP',
  cep: '03009-100',
  hours: ['Seg-Ter · 4h às 12h', 'Qua-Sex · 5h às 11h'],
  hoursShort: ['Seg-Ter · 4h-12h', 'Qua-Sex · 5h-11h'],
  /* Os mesmos horários, no formato que o Google lê (dados estruturados da
     loja). Mudou o horário acima, muda aqui também. */
  openingHours: [
    { days: ['Monday', 'Tuesday'], opens: '04:00', closes: '12:00' },
    { days: ['Wednesday', 'Thursday', 'Friday'], opens: '05:00', closes: '11:00' },
  ],
  /* Quem vende, como a lei pede numa loja virtual (Decreto 7.962/2013):
     razão social e CNPJ ficam no rodapé, nos Termos e na Privacidade. */
  razaoSocial: 'UNI BOLSAS CONFECCOES LTDA',
  cnpj: '04.639.428/0001-30',
  /* De onde os pedidos enviados saem (ponto de coleta da transportadora). */
  coleta: {
    rua: 'Rua Epiacaba, 229',
    logradouro: 'Rua Epiacaba',
    numero: '229',
    complemento: '',
    bairro: 'Parque Fongaro',
    municipio: 'São Paulo',
    uf: 'SP',
    cidade: 'São Paulo — SP',
    cep: '04257-145',
  },
  /* Inscrição Estadual (SP): vai no remetente da etiqueta, na nota e no rodapé. */
  inscricaoEstadual: '116.234.381.114',
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
