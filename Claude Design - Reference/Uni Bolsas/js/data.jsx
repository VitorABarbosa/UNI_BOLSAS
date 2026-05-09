/* =====================================================================
   DATA — produtos enriquecidos + categorias + paleta de cores + FAQ + timeline + depoimentos
   ===================================================================== */
const PRODUCTS = [
  {
    id: "matelasse-mini",
    name: "Matelassê Mini",
    tagline: "Acolchoada com fecho duplo dourado e alça de corrente trançada.",
    description:
      "A clássica do dia a dia, em formato pequeno. Couro sintético matelassê acolchoado, ferragem dourada que não escurece com o tempo, alça de corrente removível e forro têxtil interno com bolso para celular. Cabe carteira, batom, chave e celular grande sem apertar.",
    category: "bolsas",
    badge: "Mais vendida",
    price: "R$ 89,00",
    priceWholesale: "A partir de R$ 65 · 10un+",
    dimensions: "22 × 17 × 10 cm",
    weight: "0,275 kg",
    material: "PU acolchoado · forro têxtil · ferragem dourada",
    sizes: ["Único"],
    colors: [
      { name: "Preto",     hex: "#0F0F0F", images: [IMG.matelasse_preto] },
      { name: "Caramelo",  hex: "#A47551", images: [IMG.matelasse_caramelo] },
      { name: "Vinho",     hex: "#5C1A2B", images: [IMG.matelasse_vinho] },
      { name: "Off-White", hex: "#EFE9DC", images: [IMG.matelasse_offwhite] },
      { name: "Nude",      hex: "#C9A98C", images: [IMG.matelasse_nude] },
    ],
  },
  {
    id: "lartlune-kit",
    name: "Kit L'ART&LUNE",
    tagline: "Bolsa transversal estruturada + carteira combinando · alça superior.",
    description:
      "Combo prático: bolsa transversal com estrutura firme e carteira combinando, no mesmo material. Bolsa traz alça superior fixa e alça transversal removível; carteira tem 6 espaços de cartão, dois compartimentos para cédulas e zíper interno. Pra quem gosta de conjunto sem combinar.",
    category: "kits",
    badge: "Combo",
    price: "R$ 149,00",
    priceWholesale: "A partir de R$ 110 · 6un+",
    dimensions: "Bolsa 25 × 19 × 8 cm · Carteira 19 × 10 cm",
    weight: "0,520 kg (kit)",
    material: "PU estruturado · forro têxtil · ferragem dourada escovada",
    sizes: ["Único"],
    colors: [
      { name: "Caramelo",    hex: "#A47551", images: [IMG.lartlune_caramelo] },
      { name: "Off-White",   hex: "#EFE9DC", images: [IMG.lartlune_offwhite] },
      { name: "Preto",       hex: "#0F0F0F", images: [IMG.lartlune_preto] },
      { name: "Marinho",     hex: "#1A2B4A", images: [IMG.lartlune_marinho] },
      { name: "Rosa",        hex: "#E5B5B0", images: [IMG.lartlune_rosa] },
      { name: "Cinza Taupe", hex: "#8C7E72", images: [IMG.lartlune_taupe] },
    ],
  },
  {
    id: "mochila-mini-bicolor",
    name: "Mochila Mini Bicolor",
    tagline: "Mochila compacta com vivo contrastante · 22 × 27 cm.",
    description:
      "Mochila pequena de alça larga, ideal pra escola, faculdade e dia a dia. Vivo bicolor que destaca o bolso da frente, dois bolsos internos, compartimento principal com zíper duplo e tira de mão superior. Volta às aulas com a gente.",
    category: "mochilas",
    badge: "Volta às aulas",
    price: "R$ 79,00",
    priceWholesale: "A partir de R$ 59 · 10un+",
    dimensions: "22 × 27 × 11 cm",
    weight: "0,340 kg",
    material: "Nylon resinado · forro impermeável · alças acolchoadas",
    sizes: ["Único"],
    colors: [
      { name: "Preto / Branco",   hex: "#0F0F0F", accent: "#FFFFFF", images: [IMG.mochila_preto_branco, IMG.mochila_preto_branco_lifestyle] },
      { name: "Marinho / Branco", hex: "#1A2B4A", accent: "#FFFFFF", images: [IMG.mochila_marinho_branco] },
      { name: "Cinza / Branco",   hex: "#7A7C80", accent: "#FFFFFF", images: [IMG.mochila_cinza_branco] },
      { name: "Preto / Pink",     hex: "#0F0F0F", accent: "#FF1493", images: [IMG.mochila_preto_pink] },
      { name: "Marinho / Pink",   hex: "#1A2B4A", accent: "#FF1493", images: [IMG.mochila_marinho_pink] },
    ],
  },
  {
    id: "fitness",
    name: "Bolsa Fitness",
    tagline: "Mala esportiva fluída · ideal pra academia · 39 × 27 cm.",
    description:
      "Bolsa de academia com bolso lateral para tênis, divisória interna úmido/seco, alça de mão e alça transversal ajustável. Tecido resistente a respingo, fundo reforçado, pega o que precisar pro treino sem deformar.",
    category: "esportivas",
    badge: "Promoção",
    price: "R$ 65,00",
    priceWholesale: "A partir de R$ 49 · 12un+",
    dimensions: "39 × 27 × 22 cm",
    weight: "0,420 kg",
    material: "Poliéster 600D · forro impermeável · zíper YKK",
    sizes: ["P", "M", "G"],
    colors: [
      { name: "Grafite",  hex: "#3A3D40", images: [IMG.fitness_grafite] },
      { name: "Vermelho", hex: "#A82238", images: [IMG.fitness_vermelho] },
      { name: "Pink",     hex: "#C73C7E", images: [IMG.fitness_pink] },
      { name: "Marinho",  hex: "#1A2B4A", images: [IMG.fitness_marinho] },
      { name: "Preto",    hex: "#0F0F0F", images: [IMG.fitness_preto] },
    ],
  },
  {
    id: "sport",
    name: "Mala Sport",
    tagline: "Mala esportiva clássica · estrutura reforçada · 60 × 30 cm.",
    description:
      "Mala de viagem curta ou esporte, com estrutura reforçada nas laterais, bolso externo grande, alças de mão com pega acolchoada e alça transversal removível. Disponível em P, M, G, GG e Extra G — escolhe o tamanho conforme a sua bagagem.",
    category: "esportivas",
    badge: "Novidade",
    price: "R$ 119,00",
    priceWholesale: "A partir de R$ 89 · 10un+",
    dimensions: "60 × 30 × 28 cm (G) · variações P-Extra G",
    weight: "0,780 kg (G)",
    material: "Poliéster reforçado · base PVC · zíper duplo",
    sizes: ["P", "M", "G", "GG", "Extra G"],
    colors: [
      { name: "Preto",    hex: "#0F0F0F", images: [IMG.sport_preto_front, IMG.sport_preto_open] },
      { name: "Marinho",  hex: "#1A2B4A", images: [IMG.sport_marinho_front, IMG.sport_marinho_open] },
    ],
  },
];

const CATEGORIES = [
  { id: "todos",      label: "Todos" },
  { id: "bolsas",     label: "Bolsas" },
  { id: "mochilas",   label: "Mochilas" },
  { id: "kits",       label: "Kits" },
  { id: "esportivas", label: "Esportivas" },
];

// Paleta global de filtro de cor (agregada de todas as colorways)
const COLOR_PALETTE = [
  { name: "Preto",     hex: "#0F0F0F" },
  { name: "Off-White", hex: "#EFE9DC" },
  { name: "Caramelo",  hex: "#A47551" },
  { name: "Vinho",     hex: "#5C1A2B" },
  { name: "Marinho",   hex: "#1A2B4A" },
  { name: "Pink",      hex: "#C73C7E" },
  { name: "Rosa",      hex: "#E5B5B0" },
  { name: "Cinza",     hex: "#7A7C80" },
  { name: "Nude",      hex: "#C9A98C" },
  { name: "Vermelho",  hex: "#A82238" },
];

// Função de match aproximado de cor (compara hex base, considerando bicolor.hex como principal)
function productHasColor(product, paletteHex) {
  if (!paletteHex) return true;
  const target = paletteHex.toLowerCase();
  return product.colors.some((c) => {
    const h = c.hex.toLowerCase();
    return h === target || colorClose(h, target);
  });
}
function hexToRgb(h) {
  const m = h.replace("#", "");
  return [parseInt(m.slice(0,2),16), parseInt(m.slice(2,4),16), parseInt(m.slice(4,6),16)];
}
function colorClose(a, b) {
  const [r1,g1,b1] = hexToRgb(a);
  const [r2,g2,b2] = hexToRgb(b);
  const d = Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
  return d < 28; // tolerância
}

const TIMELINE = [
  { year: "2014", label: "Primeiro stand no Brás" },
  { year: "2018", label: "Atacado para outros estados" },
  { year: "2022", label: "Loja própria no Shopping 900" },
  { year: "2026", label: "+5.000 lojistas atendidas" },
];

const TESTIMONIALS = [
  {
    quote: "Compro pra minha loja há três anos. Atendimento direto, sem intermediário, e mix sempre afinado.",
    name: "Camila Reis",
    role: "Lojista · Goiânia, GO",
  },
  {
    quote: "Fui buscar uma bolsa pro trabalho e saí com duas. A Adriana me ajudou a escolher cor pelo guarda-roupa.",
    name: "Marina S.",
    role: "Cliente · São Paulo, SP",
  },
  {
    quote: "Material melhor do que parecia na foto. Já é a quarta que compro.",
    name: "Letícia A.",
    role: "Cliente · Curitiba, PR",
  },
];

const FAQ = [
  {
    q: "Vocês entregam pra todo o Brasil?",
    a: "Sim. Trabalhamos com Correios, transportadora e motoboy em São Paulo. O frete é calculado pelo CEP no momento do pedido pelo WhatsApp. Pedidos de atacado seguem por transportadora ou retirada combinada.",
  },
  {
    q: "Qual o pedido mínimo do atacado?",
    a: "O mínimo varia por modelo, geralmente entre 6 e 12 peças por referência. A tabela completa de atacado é enviada pelo WhatsApp pra lojistas cadastrados.",
  },
  {
    q: "Quais formas de pagamento aceitam?",
    a: "Pix, cartão de crédito (até 6x sem juros), débito e dinheiro na loja. Pra atacado também aceitamos boleto a partir do segundo pedido com cadastro aprovado.",
  },
  {
    q: "Posso retirar pessoalmente no Brás?",
    a: "Pode sim. Estamos no Shopping 900, Rua Monsenhor de Andrade, 900 — segunda a sexta, das 4h às 10h. Confirma antes pelo WhatsApp pra gente reservar a peça.",
  },
  {
    q: "Tem política de troca?",
    a: "Pra varejo, troca em até 7 dias úteis após o recebimento, com a peça sem uso e na embalagem original. Pra atacado, defeito de fabricação é trocado mediante envio de foto pelo WhatsApp em até 30 dias.",
  },
  {
    q: "Vocês atendem por telefone ou só WhatsApp?",
    a: "Atendimento principal é por WhatsApp pra registrar o pedido por escrito e mandar fotos extras. Se preferir falar por voz, marca uma chamada pelo próprio WhatsApp.",
  },
  {
    q: "Como funciona o cupom UNI5 de 5% OFF?",
    a: "Válido só na primeira compra de varejo, em qualquer peça do catálogo. Não acumula com outras promoções. Você fala o cupom no início da conversa pelo WhatsApp e a gente já aplica no orçamento.",
  },
  {
    q: "Vocês têm catálogo em PDF?",
    a: "Sim, pra lojistas. Mande mensagem pelo WhatsApp dizendo que é lojista e a gente envia o PDF atualizado, com tabela de preço de atacado e disponibilidade.",
  },
];

window.PRODUCTS = PRODUCTS;
window.CATEGORIES = CATEGORIES;
window.COLOR_PALETTE = COLOR_PALETTE;
window.productHasColor = productHasColor;
window.TIMELINE = TIMELINE;
window.TESTIMONIALS = TESTIMONIALS;
window.FAQ = FAQ;
