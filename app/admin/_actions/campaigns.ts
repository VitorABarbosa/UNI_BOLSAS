'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; missingTable?: true };

/**
 * O código roda com ou sem as tabelas de campanha: enquanto a migration
 * `20260824000100_campaigns.sql` não for aplicada, o painel mostra um aviso
 * em vez de quebrar. Este é o código que o Postgres devolve pra tabela
 * inexistente.
 */
const UNDEFINED_TABLE = '42P01';

function tableMissing(error: { code?: string } | null): boolean {
  return error?.code === UNDEFINED_TABLE;
}

export type CampaignRow = {
  id: string;
  name: string;
  discount_kind: string;
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  product_count: number;
};

export async function listCampaigns(): Promise<ActionResult<CampaignRow[]>> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      'id, name, discount_kind, discount_value, starts_at, ends_at, active, campaign_products(count)',
    )
    .order('created_at', { ascending: false });

  if (error) {
    if (tableMissing(error)) {
      return { ok: false, error: 'Tabelas de campanha não aplicadas', missingTable: true };
    }
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    data: (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      discount_kind: c.discount_kind,
      discount_value: Number(c.discount_value),
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      active: c.active,
      product_count:
        (c.campaign_products as unknown as { count: number }[] | null)?.[0]
          ?.count ?? 0,
    })),
  };
}

const CampaignSchema = z.object({
  name: z.string().min(1, 'Dê um nome à campanha').max(80),
  discount_kind: z.enum(['percent', 'fixed']),
  discount_value: z.coerce.number().positive('O desconto precisa ser maior que zero'),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  active: z.boolean(),
});

export type CampaignInput = z.infer<typeof CampaignSchema>;

function validate(input: CampaignInput): string | null {
  const parsed = CampaignSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? 'Dados inválidos';
  }
  if (parsed.data.discount_kind === 'percent' && parsed.data.discount_value >= 100) {
    return 'O desconto precisa ser menor que 100%';
  }
  return null;
}

export async function createCampaign(
  input: CampaignInput,
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const problem = validate(input);
  if (problem) return { ok: false, error: problem };

  const { data, error } = await supabase
    .from('campaigns')
    .insert(CampaignSchema.parse(input))
    .select('id')
    .single();
  if (error) {
    if (tableMissing(error)) {
      return { ok: false, error: 'Tabelas de campanha não aplicadas', missingTable: true };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/campanhas');
  return { ok: true, data: { id: data.id } };
}

export async function updateCampaign(
  id: string,
  input: CampaignInput,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const problem = validate(input);
  if (problem) return { ok: false, error: problem };

  const { error } = await supabase
    .from('campaigns')
    .update(CampaignSchema.parse(input))
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/admin/campanhas');
  return { ok: true, data: undefined };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  // `campaign_products` cai junto por ON DELETE CASCADE.
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/admin/campanhas');
  return { ok: true, data: undefined };
}

/** Substitui a lista de peças da campanha pela seleção atual do admin. */
export async function setCampaignProducts(
  campaignId: string,
  productIds: string[],
): Promise<ActionResult<{ count: number }>> {
  const { supabase } = await requireAdmin();
  const parsed = z.array(z.string().uuid()).max(1000).safeParse(productIds);
  const idOk = z.string().uuid().safeParse(campaignId);
  if (!parsed.success || !idOk.success) {
    return { ok: false, error: 'Seleção inválida' };
  }

  // Troca por inteiro: mais simples e previsível que calcular o diff, e a
  // tabela é pequena (uma linha por peça da campanha).
  const { error: clearError } = await supabase
    .from('campaign_products')
    .delete()
    .eq('campaign_id', idOk.data);
  if (clearError) return { ok: false, error: clearError.message };

  if (parsed.data.length > 0) {
    const { error } = await supabase.from('campaign_products').insert(
      parsed.data.map((product_id) => ({
        campaign_id: idOk.data,
        product_id,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/campanhas');
  return { ok: true, data: { count: parsed.data.length } };
}
