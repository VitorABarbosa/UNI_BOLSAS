import { PEDIDO_MINIMO, PEDIDO_MINIMO_FRASE } from './atacado';

export const FAQ = [
  {
    q: 'Vocês vendem no varejo?',
    a: `Não. A Uni Bolsas vende só no atacado, ${PEDIDO_MINIMO_FRASE} por pedido. Não vendemos peça avulsa.`,
  },
  {
    q: 'Qual o pedido mínimo?',
    a: `${PEDIDO_MINIMO} peças por pedido. A tabela completa de atacado é enviada pelo WhatsApp.`,
  },
  {
    q: 'Vocês entregam pra todo o Brasil?',
    a: 'Sim. Os pedidos seguem por transportadora ou retirada combinada no Brás. O frete é calculado pelo CEP no momento do pedido pelo WhatsApp.',
  },
  {
    q: 'Quais formas de pagamento aceitam?',
    a: 'Pix, cartão de crédito (até 6x sem juros), débito e dinheiro na loja. Também aceitamos boleto a partir do segundo pedido com cadastro aprovado.',
  },
  {
    q: 'Posso retirar pessoalmente no Brás?',
    a: 'Pode sim. Estamos no Shopping 900, loja 312, no corredor C (Rua Monsenhor de Andrade, 900) — segunda e terça das 4h às 12h, quarta a sexta das 5h às 11h. Confirma antes pelo WhatsApp pra gente separar o pedido.',
  },
  {
    q: 'Tem política de troca?',
    a: 'Defeito de fabricação é trocado mediante envio de foto pelo WhatsApp em até 30 dias.',
  },
  {
    q: 'Vocês atendem por telefone ou só WhatsApp?',
    a: 'Atendimento principal é por WhatsApp pra registrar o pedido por escrito e mandar fotos extras. Se preferir falar por voz, marca uma chamada pelo próprio WhatsApp.',
  },
  {
    q: 'Vocês têm catálogo em PDF?',
    a: 'Sim. Mande mensagem pelo WhatsApp e a gente envia o PDF atualizado, com tabela de preço de atacado e disponibilidade.',
  },
] as const satisfies ReadonlyArray<{ q: string; a: string }>;

export type FaqItem = (typeof FAQ)[number];
