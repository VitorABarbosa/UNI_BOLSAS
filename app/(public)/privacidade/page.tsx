import type { Metadata } from 'next';
import Link from 'next/link';
import { STORE } from '@/lib/content/store';
import { waLink } from '@/lib/whatsapp';
import { CookiePrefsButton } from '@/components/public/shell/CookieConsent';
import { CONSENT_DAYS } from '@/lib/consent';
import { RETAIN_DAYS } from '@/lib/analytics/policy';

export const metadata: Metadata = {
  title: 'Política de Privacidade · Uni Bolsas',
  description:
    'O que a Uni Bolsas mede no site, por quê, por quanto tempo guarda e como você exerce seus direitos pela LGPD.',
  alternates: { canonical: '/privacidade' },
};

/** Atualize junto com qualquer mudança no que é coletado. */
const ATUALIZADO_EM = '24 de novembro de 2026';

const CONTATO = waLink(
  'Olá! É sobre privacidade / meus dados no site da Uni Bolsas.',
);

/**
 * Política de Privacidade.
 *
 * Escrita a partir do que o código REALMENTE faz — `lib/analytics/store` e
 * `app/api/hit` — e não de um modelo genérico. Uma política que promete menos
 * do que o site faz é uma infração; uma que promete mais é ficção. Se um
 * campo novo entrar na medição, esta página muda no mesmo commit.
 *
 * O tom é o do resto do site: frase curta, sem juridiquês onde não precisa.
 * A LGPD (art. 9º) pede informação "clara, adequada e ostensiva" — texto que
 * ninguém entende não cumpre a lei, só finge cumprir.
 */
export default function PrivacidadePage() {
  return (
    <div className="uni-legal uni-section">
      <div className="uni-container">
        <div className="uni-legal-head">
          <div className="uni-eyebrow uni-eyebrow-wide">Seus dados</div>
          <h1 className="uni-h1">
            Política de <em>Privacidade.</em>
          </h1>
          <p className="uni-legal-lede">
            Somos uma loja de bolsas no Brás, não uma empresa de dados. Quem só
            navega é medido no mínimo, sem ser identificado. Quem cria conta e
            compra pelo site nos passa os dados da loja, que usamos para
            atender o pedido — e nada além disso. Abaixo está exatamente o quê,
            por quê e por quanto tempo.
          </p>
          <p className="uni-legal-date">Atualizada em {ATUALIZADO_EM}</p>
        </div>

        <div className="uni-legal-body">
          <section>
            <h2>1. Quem trata seus dados</h2>
            <p>
              <strong>Uni Bolsas</strong> ({STORE.razaoSocial}, CNPJ {STORE.cnpj}), com stand no{' '}
              {STORE.name} ({STORE.unitText}), {STORE.street},{' '}
              {STORE.district}, {STORE.city},
              CEP {STORE.cep}. Somos o <em>controlador</em> dos dados na
              definição da Lei 13.709/2018 (LGPD).
            </p>
            <p>
              Canal para falar de privacidade, tirar dúvidas ou exercer seus
              direitos:{' '}
              <a href={CONTATO} target="_blank" rel="noopener noreferrer">
                nosso WhatsApp
              </a>
              . É o mesmo número do atendimento e respondemos por ele.
            </p>
          </section>

          <section>
            <h2>2. O que o site coleta</h2>
            <p>
              <strong>De toda visita</strong>, mesmo de quem recusa cookies —
              sempre em número somado, sem nada que aponte pra uma pessoa:
            </p>
            <ul>
              <li>a página aberta (por exemplo, “/” ou “/produtos/bolsa-x”);</li>
              <li>a data e a hora, no fuso de São Paulo;</li>
              <li>se o acesso veio de celular ou de computador;</li>
              <li>
                o endereço do site de onde você chegou, quando existe (só o
                domínio, como “google.com” ou “instagram.com”);
              </li>
              <li>o clique no botão do WhatsApp e em qual peça ele estava.</li>
            </ul>
            <p>
              <strong>De quem cria conta e compra pelo site</strong>: nome, nome
              da loja ou razão social (se houver), CPF ou CNPJ, WhatsApp, e-mail e senha; e, em
              cada pedido, as peças, os valores, a forma de entrega e, se for
              envio, o endereço. A senha é guardada embaralhada (criptografia
              de mão única): nem nós conseguimos lê-la. Os dados do cartão são
              digitados direto na tela do Mercado Pago e{' '}
              <strong>não passam pelo nosso site</strong>.
            </p>
            <p>
              <strong>De quem aceita os cookies</strong>, além do acima: um
              código sorteado, guardado num cookie chamado{' '}
              <code>uni_vid</code>. Ele não sabe seu nome nem nada sobre você —
              serve só pra não contarmos a mesma pessoa duas vezes e pra
              sabermos se é a primeira visita ou um retorno.
            </p>
          </section>

          <section>
            <h2>3. O que o site NÃO coleta</h2>
            <p>
              De quem só navega, sem criar conta: nome, e-mail, telefone, CPF,
              endereço, dados de pagamento,
              localização, sua lista de páginas visitadas em outros sites, nem
              qualquer “impressão digital” do seu navegador. Também{' '}
              <strong>não guardamos seu IP</strong>: ele chega ao nosso
              servidor porque é assim que a internet funciona, mas não é lido
              nem gravado em lugar nenhum. (Se você aceitar os cookies, o
              Google recebe o seu — veja a seção 7.)
            </p>
            <p>
              Não usamos pixel do Facebook nem rastreador de publicidade. Para
              entender melhor a audiência usamos o{' '}
              <strong>Google Analytics</strong> — e só depois do seu aceite
              (veja a seção 7).
            </p>
            <p>
              As fontes de texto são servidas pelo nosso servidor, não pelo
              Google — abrir o site não avisa ninguém lá fora que você entrou.
            </p>
          </section>

          <section>
            <h2>4. Para que usamos</h2>
            <ul>
              <li>
                saber quantas pessoas visitam o site e em que horários, pra
                decidir quando publicar novidade;
              </li>
              <li>
                saber quais peças são mais vistas e quais levam ao WhatsApp, pra
                escolher o que colocar em destaque e o que produzir;
              </li>
              <li>
                saber de onde as pessoas chegam, pra entender o que funciona.
              </li>
              <li>
                com os dados da conta e do pedido: confirmar o pagamento,
                separar as peças, avisar quando estiver pronto, combinar o
                frete, emitir a nota fiscal e atender trocas — e mandar os
                e-mails da conta (confirmação, nova senha, pedido).
              </li>
            </ul>
            <p>
              Não usamos esses dados para publicidade dirigida, não montamos
              perfil de ninguém e não tomamos nenhuma decisão automatizada
              sobre você.
            </p>
          </section>

          <section>
            <h2>5. Com que base legal</h2>
            <ul>
              <li>
                <strong>Consentimento</strong> (art. 7º, I) para o cookie{' '}
                <code>uni_vid</code> e para o Google Analytics. Você escolhe no
                aviso, e pode desfazer quando quiser.
              </li>
              <li>
                <strong>Legítimo interesse</strong> (art. 7º, IX) para a
                contagem agregada e anônima de visitas, que não identifica
                ninguém e é o mínimo pra saber se o site está de pé e sendo
                usado.
              </li>
              <li>
                <strong>Execução de contrato</strong> (art. 7º, V) para a conta
                e os pedidos: sem esses dados não dá para vender, entregar nem
                trocar.
              </li>
              <li>
                <strong>Obrigação legal</strong> (art. 7º, II) para guardar os
                registros de venda e a nota fiscal pelo prazo que a lei fiscal
                exige.
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Cookies usados</h2>
            <div className="uni-legal-table">
              <table>
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Para quê</th>
                    <th>Validade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>uni_consent</code>
                    </td>
                    <td>
                      Guarda a sua escolha no aviso, pra não perguntarmos de
                      novo a cada página. Necessário — existe mesmo se você
                      recusar a medição.
                    </td>
                    <td>{CONSENT_DAYS} dias</td>
                  </tr>
                  <tr>
                    <td>
                      <code>uni_vid</code>
                    </td>
                    <td>
                      Código sorteado que evita contar a mesma pessoa duas
                      vezes. Só existe se você aceitar.
                    </td>
                    <td>180 dias</td>
                  </tr>
                  <tr>
                    <td>
                      <code>sb-…-auth-token</code>
                    </td>
                    <td>
                      Mantém você logado na sua conta. Só existe depois que você
                      entra, e some quando você sai. Necessário.
                    </td>
                    <td>enquanto a sessão durar</td>
                  </tr>
                  <tr>
                    <td>
                      <code>_ga</code>, <code>_ga_*</code>
                    </td>
                    <td>
                      Do Google Analytics: distinguem visitantes e sessões.
                      Só existem se você aceitar, e são apagados no momento em
                      que você trocar a escolha para “só o essencial”.
                    </td>
                    <td>até 2 anos</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Nenhum deles é de propaganda. Os nossos são os de escolha, de
              contagem e de login; os do Google só entram com o seu aceite.
            </p>
          </section>

          <section>
            <h2>7. Google Analytics</h2>
            <p>
              Usamos o <strong>Google Analytics 4</strong> para entender de
              onde as pessoas chegam, quais peças despertam mais interesse e
              quantas acabam nos chamando no WhatsApp. É ele que nos diz se
              vale a pena publicar num horário ou noutro, e qual bolsa merece
              destaque.
            </p>
            <p>
              Ele <strong>só carrega depois do seu aceite</strong> no aviso de
              cookies. Não é o Analytics ligado em modo reduzido: enquanto
              você não aceitar, o script do Google simplesmente não existe na
              página, e o Google não fica sabendo que você entrou. Se você
              escolher “só o essencial”, ou mudar de ideia depois de ter
              aceitado, ele é desligado e os cookies <code>_ga</code> são
              apagados na mesma hora.
            </p>
            <p>
              O que o Google recebe, quando você aceita: as páginas que você
              abriu, o horário, o aparelho, a origem do acesso e o clique no
              botão do WhatsApp. O endereço IP é usado por ele para estimar a
              região e não é guardado por nós. Base legal:{' '}
              <strong>consentimento</strong> (art. 7º, I). Nunca enviamos nome,
              e-mail ou telefone.
            </p>
            <p>
              O tratamento do Google segue as políticas dele, disponíveis em{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                policies.google.com/privacy
              </a>
              .
            </p>
          </section>

          <section>
            <h2>8. O mapa do Google</h2>
            <p>
              A página inicial mostra onde ficamos. O mapa é um serviço do
              Google e, ao carregar, ele recebe seus dados de acesso e grava
              cookies próprios — o que foge do nosso controle.
            </p>
            <p>
              Por isso ele <strong>não carrega sozinho</strong>: aparece um
              cartão com o endereço e um botão. O mapa do Google só entra se
              você tocar nesse botão, ou se já tiver aceitado os cookies. Se
              preferir não abrir, o endereço, o horário e os links de rota
              continuam ali.
            </p>
          </section>

          <section>
            <h2>9. Com quem compartilhamos</h2>
            <p>
              Com ninguém, para fins comerciais. Não vendemos, não trocamos e
              não cedemos dado nenhum.
            </p>
            <p>
              Estes fornecedores tratam dados por nossa conta e sob nossa
              instrução, como <em>operadores</em> (art. 5º, VII):{' '}
              <strong>Hostinger</strong>, que hospeda o site,{' '}
              <strong>Supabase</strong>, onde ficam o catálogo e os números de
              audiência, e o <strong>Google</strong>, pelo Analytics descrito
              na seção 7. Eles podem processar dados fora do Brasil, o que a
              LGPD permite (art. 33).
            </p>
            <p>
              Para quem cria conta e compra pelo site, entram mais estes
              operadores: o <strong>Supabase</strong> guarda a conta (e a senha
              embaralhada); o <strong>Mercado Pago</strong> processa o
              pagamento e guarda os dados do pedido (peças, valores, dados da
              loja e entrega), sob a política de privacidade dele; o{' '}
              <strong>Resend</strong> entrega os e-mails da conta e do pedido; o{' '}
              <strong>Bling</strong> emite a nota fiscal (recebe os dados da loja,
              o endereço e as peças); o <strong>Melhor Envio</strong> gera a
              etiqueta. Se o pedido for enviado, a transportadora recebe o nome,
              o telefone e o endereço de entrega, só para entregar.
            </p>
            <p>
              Quando você toca no botão do WhatsApp, a conversa passa a
              acontecer no WhatsApp, sob a política de privacidade da Meta. O
              que você nos escreve por lá fica no nosso atendimento.
            </p>
          </section>

          <section>
            <h2>10. Por quanto tempo guardamos</h2>
            <ul>
              <li>
                Os registros individuais de visita viram um resumo do dia e{' '}
                <strong>são apagados</strong> quando o dia fecha — na prática,
                na primeira vez que abrimos o painel depois disso.
              </li>
              <li>
                Os resumos diários — que já são só números somados — ficam por{' '}
                {RETAIN_DAYS} dias e depois são apagados automaticamente.
              </li>
              <li>
                O cookie <code>uni_vid</code> expira em 180 dias, e some no
                momento em que você trocar sua escolha para “só o essencial”.
              </li>
              <li>A conta fica enquanto você quiser; pedindo, apagamos.</li>
              <li>
                Os registros dos pedidos e das notas fiscais ficam pelo prazo
                que a lei fiscal exige (em geral, 5 anos), mesmo que a conta seja
                apagada.
              </li>
            </ul>
          </section>

          <section>
            <h2>11. Seus direitos</h2>
            <p>
              A LGPD (art. 18) garante a você, a qualquer momento e sem custo:
              confirmar se tratamos dados seus; acessá-los; corrigi-los; pedir
              anonimização, bloqueio ou eliminação; pedir portabilidade; saber
              com quem compartilhamos; revogar o consentimento; e se opor a um
              tratamento.
            </p>
            <p>
              Para exercer qualquer um deles, fale com a gente{' '}
              <a href={CONTATO} target="_blank" rel="noopener noreferrer">
                pelo WhatsApp
              </a>
              . Respondemos em até 15 dias.
            </p>
            <p>
              Se você tem conta, dá para ver e corrigir os dados da loja e
              acompanhar os pedidos em <Link href="/conta">Minha conta</Link>.
              Para pedir uma cópia dos dados ou apagar a conta, fale com a gente
              pelo WhatsApp a partir do número cadastrado.
            </p>
            <p className="uni-legal-note">
              Um aviso honesto sobre o que está ao nosso alcance. Nos números de
              visita não guardamos nada que ligue um dado a uma pessoa, então
              ali não existe uma linha com o seu nome para mostrar ou
              apagar. No Google Analytics existe um código de visitante, mas
              ele é do Google e nós não conseguimos buscar por ele. O que você
              pode fazer, e tem efeito imediato, é revogar o consentimento: o
              Analytics é desligado e os cookies dele são apagados do seu
              navegador na hora.
            </p>
            <p>
              <CookiePrefsButton className="uni-legal-btn" />
            </p>
          </section>

          <section>
            <h2>12. Segurança</h2>
            <p>
              O site roda inteiro em HTTPS. O cookie de medição é{' '}
              <code>httpOnly</code> e <code>secure</code>, ou seja, nenhum
              script consegue lê-lo. O acesso ao painel administrativo é
              restrito e protegido por senha. As senhas das contas são
              guardadas com criptografia de mão única, os links de e-mail
              (confirmar conta, nova senha) valem uma vez só, e quem troca a
              senha derruba as outras sessões abertas.
            </p>
          </section>

          <section>
            <h2>13. Mudanças nesta política</h2>
            <p>
              Se o que coletamos mudar, este texto muda junto e a data no topo
              é atualizada. Mudança que dependa do seu consentimento faz o aviso
              aparecer de novo.
            </p>
          </section>

          <section>
            <h2>14. ANPD</h2>
            <p>
              Se você achar que não tratamos bem um pedido seu, pode procurar a
              Autoridade Nacional de Proteção de Dados —{' '}
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
              >
                gov.br/anpd
              </a>
              . Preferimos resolver direto com você, mas o caminho existe e é
              seu.
            </p>
          </section>
        </div>

        <p className="uni-legal-back">
          <Link href="/">← Voltar pro catálogo</Link>
        </p>
      </div>
    </div>
  );
}
