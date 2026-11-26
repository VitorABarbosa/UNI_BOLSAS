/**
 * Lookbook da página inicial: dez looks, cada um com uma bolsa real do
 * catálogo. A imagem da modelo e a foto da bolsa ficam em /public/lookbook.
 * Preço, nome e link vêm do catálogo (se a peça sair do ar, o look some).
 *
 * `cor` é a cor da bolsa que a modelo usa (entra no pedido com ela) e
 * `fotoPedido` é a foto dessa cor no Storage (miniatura no pedido).
 */
export type LookConfig = {
  look: number;
  tema: string;
  produtoId: string;
  cor: string | null;
  fotoPedido: string;
  /** largura / altura da imagem da modelo */
  proporcao: number;
};

export const LOOKS: LookConfig[] = [
  { look: 1, tema: 'Festa e noite', produtoId: '92f4444c-4fce-4324-90fa-fbe476368997', cor: 'Vermelho', fotoPedido: '92f4444c-4fce-4324-90fa-fbe476368997/3cc5d52c-9269-45bd-8ebe-08267aaba301.jpg', proporcao: 0.3029 },
  { look: 2, tema: 'Passeio elegante', produtoId: 'b77440c0-ec5e-4861-99a0-5fb4345817a4', cor: 'Off White', fotoPedido: 'b77440c0-ec5e-4861-99a0-5fb4345817a4/32382960-9239-4556-9856-35da4ac3b9b8.jpg', proporcao: 0.2936 },
  { look: 3, tema: 'Verão', produtoId: 'f835f55a-682a-4bbb-95fe-d6c3bb92c610', cor: null, fotoPedido: 'f835f55a-682a-4bbb-95fe-d6c3bb92c610/d35638df-9321-455a-b793-feea0c86ea82.jpg', proporcao: 0.3736 },
  { look: 4, tema: 'Trabalho', produtoId: '4f548293-a2ef-467b-8be6-189c6bffd507', cor: 'Caramelo', fotoPedido: '4f548293-a2ef-467b-8be6-189c6bffd507/b3c508e7-8bd1-4413-8313-cb61ad7b337f.jpg', proporcao: 0.3379 },
  { look: 5, tema: 'Executiva', produtoId: '508d5011-7537-4c70-82ee-b473a4d70e10', cor: 'Vinho', fotoPedido: '508d5011-7537-4c70-82ee-b473a4d70e10/8cb094f7-7ec1-4102-a4a5-8d57a95b7842.jpg', proporcao: 0.2914 },
  { look: 6, tema: 'Casual', produtoId: '3e924cb0-927b-427a-bc44-067a468310dd', cor: 'Preto', fotoPedido: '3e924cb0-927b-427a-bc44-067a468310dd/27ec7caa-b766-47c6-935e-11cda6421ead.jpg', proporcao: 0.4543 },
  { look: 7, tema: 'Viagem', produtoId: '8799efc4-2bed-48d1-bf4f-6c9c946a5ff5', cor: 'Roxo', fotoPedido: '8799efc4-2bed-48d1-bf4f-6c9c946a5ff5/2e7ec8d8-ed51-41cb-bef1-d299b9af81bc.jpg', proporcao: 0.5336 },
  { look: 8, tema: 'Academia', produtoId: '608c07b9-7da3-4f46-96a6-7e6e2a8dee3d', cor: 'Vermelho', fotoPedido: '608c07b9-7da3-4f46-96a6-7e6e2a8dee3d/6560477b-b739-47f7-8607-a02c38877ed1.jpg', proporcao: 0.3407 },
  { look: 9, tema: 'Praia', produtoId: '5fe0a6e9-385d-4386-a81e-ba1a9e65808b', cor: 'Laranja', fotoPedido: '5fe0a6e9-385d-4386-a81e-ba1a9e65808b/9b8c5b39-a3a5-4c25-9306-c901ae2266a7.jpg', proporcao: 0.4536 },
  { look: 10, tema: 'Faculdade e passeio', produtoId: '1af3fa33-f4b5-465c-8c72-fe648c6da40b', cor: 'Rosa', fotoPedido: '1af3fa33-f4b5-465c-8c72-fe648c6da40b/de7fdc31-94a7-4b8c-8fb8-97e85df2a56f.jpg', proporcao: 0.3679 },
];

export const nn = (n: number) => String(n).padStart(2, '0');
