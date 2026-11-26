import { PEDIDO_MINIMO, PEDIDO_MINIMO_FRASE } from './atacado';
import { COMPRA_NO_SITE } from '@/lib/contas/ligado';

const FAQ_WHATS = [
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

/** Com a compra pelo site ligada: as respostas seguem o checkout, os Termos e a política de trocas. */
const FAQ_SITE = [
  {
    q: 'Vocês vendem no varejo?',
    a: `Não. A Uni Bolsas vende só no atacado, ${PEDIDO_MINIMO_FRASE} por pedido. Não vendemos peça avulsa.`,
  },
  {
    q: 'Como eu compro?',
    a: `Aqui no site: coloque no mínimo ${PEDIDO_MINIMO} peças na sacola, crie sua conta (com CPF ou CNPJ) e pague com Pix, cartão ou boleto pelo Mercado Pago. Você acompanha o pedido na sua conta.`,
  },
  {
    q: 'Qual o pedido mínimo?',
    a: `${PEDIDO_MINIMO} peças por pedido, podendo misturar modelos e cores. Os preços de atacado já aparecem no site.`,
  },
  {
    q: 'Vocês entregam pra todo o Brasil?',
    a: 'Sim. O frete é calculado pelo CEP na hora de fechar o pedido (Correios, Jadlog e outras), com seguro, e o rastreio aparece na sua conta. Se preferir, retire grátis no Brás.',
  },
  {
    q: 'Quais formas de pagamento aceitam?',
    a: 'No site: Pix, cartão de crédito ou boleto, pelo Mercado Pago. Os dados do cartão não passam pelo nosso site.',
  },
  {
    q: 'Posso retirar pessoalmente no Brás?',
    a: 'Pode sim. Ao finalizar, escolha "Retirar na loja": avisamos no seu WhatsApp quando estiver separado. Estamos no Shopping 900, loja 312, no corredor C (Rua Monsenhor de Andrade, 900) — segunda e terça das 4h às 12h, quarta a sexta das 5h às 11h.',
  },
  {
    q: 'Tem política de troca?',
    a: 'Peça com defeito de fabricação é trocada: avise em até 7 dias depois de receber, pelo WhatsApp, com o número do pedido e fotos. Os detalhes estão na página Trocas, no rodapé.',
  },
  {
    q: 'Vocês têm catálogo em PDF?',
    a: 'Sim. No rodapé, em "Catálogo em PDF", dá pra baixar ou mandar pra alguém.',
  },
] as const satisfies ReadonlyArray<{ q: string; a: string }>;

export const FAQ: ReadonlyArray<{ q: string; a: string }> = COMPRA_NO_SITE ? FAQ_SITE : FAQ_WHATS;

export type FaqItem = { q: string; a: string };
