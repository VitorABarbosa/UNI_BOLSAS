/* =====================================================================
   TOKENS — paleta + constantes globais
   ===================================================================== */
const TOKENS = {
  bone: "#F4EFE6",
  boneLight: "#FAF7F1",
  ink: "#111111",
  charcoal: "#2A2724",
  stone: "#6E665C",
  whisper: "#E5DECF",
  pearl: "#FFFFFF",
  leather: "#8B5A3C",
  leatherDark: "#6B4326",
  caramel: "#C9934A",
  // novos acentos sazonais
  wine: "#5C1A2B",
  sage: "#8FA68E",
  black: "#0A0A0A",
  whatsapp: "#25D366",
  whatsappDark: "#128C7E",
};

const WHATSAPP = "5511988063432";
const INSTAGRAM = "uni_bolsas";

const STORE = {
  name: "Shopping 900",
  street: "Rua Monsenhor de Andrade, 900",
  district: "Brás",
  city: "São Paulo — SP",
  cep: "03009-100",
  hours: "Segunda a Sexta · 4h às 10h",
  hoursShort: "Seg-Sex · 4h-10h",
  cnpj: "00.000.000/0001-00",
  transport: [
    { mode: "Metrô Brás", time: "8 min" },
    { mode: "CPTM Brás", time: "5 min" },
    { mode: "Ônibus 100 · 270", time: "porta" },
  ],
  lat: -23.5326,
  lng: -46.6126,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Shopping+900+Rua+Monsenhor+de+Andrade+900+Br%C3%A1s+S%C3%A3o+Paulo",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Shopping+900+Rua+Monsenhor+de+Andrade+900+Br%C3%A1s+S%C3%A3o+Paulo",
  wazeUrl:
    "https://waze.com/ul?ll=-23.5326,-46.6126&navigate=yes",
};

/* ---------- WhatsApp helpers ---------- */
function waLink(message) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}
const waGeneral = waLink(
  "Olá! Vim pelo catálogo Uni Bolsas e gostaria de mais informações."
);
function waProduct(product, color, size) {
  const colorPart = color ? ` na cor ${color.name}` : "";
  const sizePart = size ? ` tamanho ${size}` : "";
  const priceMsg = product.price ? ` (${product.price})` : "";
  return waLink(
    `Olá! Tenho interesse na ${product.name}${colorPart}${sizePart}${priceMsg}. Está disponível?`
  );
}
const waWholesale = waLink(
  "Olá! Sou lojista e gostaria de receber a tabela de atacado da Uni Bolsas."
);
const waRetail = waLink(
  "Olá! Quero comprar uma bolsa. Pode me ajudar com sugestões?"
);
function waNewsletter(type, phone) {
  const role = type === "wholesale" ? "lojista (atacado)" : "cliente final";
  const phonePart = phone ? ` Meu WhatsApp é ${phone}.` : "";
  return waLink(
    `Olá! Quero receber lançamentos e novidades como ${role}.${phonePart}`
  );
}

window.TOKENS = TOKENS;
window.WHATSAPP = WHATSAPP;
window.INSTAGRAM = INSTAGRAM;
window.STORE = STORE;
window.waLink = waLink;
window.waGeneral = waGeneral;
window.waProduct = waProduct;
window.waWholesale = waWholesale;
window.waRetail = waRetail;
window.waNewsletter = waNewsletter;
