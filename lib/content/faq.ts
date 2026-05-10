export const FAQ = [
  {
    q: 'Vocês entregam pra todo o Brasil?',
    a: 'Sim. Trabalhamos com Correios, transportadora e motoboy em São Paulo. O frete é calculado pelo CEP no momento do pedido pelo WhatsApp. Pedidos de atacado seguem por transportadora ou retirada combinada.',
  },
  {
    q: 'Qual o pedido mínimo do atacado?',
    a: 'O mínimo varia por modelo, geralmente entre 6 e 12 peças por referência. A tabela completa de atacado é enviada pelo WhatsApp pra lojistas cadastrados.',
  },
  {
    q: 'Quais formas de pagamento aceitam?',
    a: 'Pix, cartão de crédito (até 6x sem juros), débito e dinheiro na loja. Pra atacado também aceitamos boleto a partir do segundo pedido com cadastro aprovado.',
  },
  {
    q: 'Posso retirar pessoalmente no Brás?',
    a: 'Pode sim. Estamos no Shopping 900, Rua Monsenhor de Andrade, 900 — segunda e terça das 4h às 12h, quarta a sexta das 5h às 11h. Confirma antes pelo WhatsApp pra gente reservar a peça.',
  },
  {
    q: 'Tem política de troca?',
    a: 'Pra varejo, troca em até 7 dias úteis após o recebimento, com a peça sem uso e na embalagem original. Pra atacado, defeito de fabricação é trocado mediante envio de foto pelo WhatsApp em até 30 dias.',
  },
  {
    q: 'Vocês atendem por telefone ou só WhatsApp?',
    a: 'Atendimento principal é por WhatsApp pra registrar o pedido por escrito e mandar fotos extras. Se preferir falar por voz, marca uma chamada pelo próprio WhatsApp.',
  },
  {
    q: 'Como funciona o cupom UNI5 de 5% OFF?',
    a: 'Válido só na primeira compra de varejo, em qualquer peça do catálogo. Não acumula com outras promoções. Você fala o cupom no início da conversa pelo WhatsApp e a gente já aplica no orçamento.',
  },
  {
    q: 'Vocês têm catálogo em PDF?',
    a: 'Sim, pra lojistas. Mande mensagem pelo WhatsApp dizendo que é lojista e a gente envia o PDF atualizado, com tabela de preço de atacado e disponibilidade.',
  },
] as const satisfies ReadonlyArray<{ q: string; a: string }>;

export type FaqItem = (typeof FAQ)[number];
