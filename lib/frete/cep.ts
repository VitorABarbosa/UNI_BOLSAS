/**
 * Busca rua, bairro, cidade e UF pelo CEP, direto do navegador da cliente.
 *
 * Usa o ViaCEP e, se ele não responder, a BrasilAPI. São serviços públicos e
 * gratuitos; só o CEP sai daqui. Se nenhum responder, devolve null e a
 * cliente preenche à mão, como antes.
 */
export type EnderecoDoCep = { rua: string; bairro: string; cidade: string; uf: string };

async function json(url: string): Promise<unknown> {
  const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

export async function buscarCep(cep: string): Promise<EnderecoDoCep | null> {
  const d = cep.replace(/\D+/g, '');
  if (d.length !== 8) return null;
  try {
    const v = (await json(`https://viacep.com.br/ws/${d}/json/`)) as Record<string, string | boolean>;
    if (!v.erro && v.localidade) {
      return { rua: String(v.logradouro ?? ''), bairro: String(v.bairro ?? ''), cidade: String(v.localidade), uf: String(v.uf ?? '') };
    }
  } catch {
    /* tenta a próxima */
  }
  try {
    const b = (await json(`https://brasilapi.com.br/api/cep/v1/${d}`)) as Record<string, string>;
    if (b.city) return { rua: b.street ?? '', bairro: b.neighborhood ?? '', cidade: b.city, uf: b.state ?? '' };
  } catch {
    /* sem busca: preenche à mão */
  }
  return null;
}
