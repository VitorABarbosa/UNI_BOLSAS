import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import {
  CampaignsManager,
  type PickerProduct,
} from '@/components/admin/CampaignsManager';
import { listCampaigns, type CampaignRow } from '@/app/admin/_actions/campaigns';

export const metadata = {
  title: 'Campanhas · Uni Bolsas Admin',
};

export default async function CampanhasPage() {
  const { user, supabase } = await requireAdmin();

  const campaignsResult = await listCampaigns();
  const missingTable = !campaignsResult.ok && campaignsResult.missingTable === true;
  const campaigns: CampaignRow[] = campaignsResult.ok ? campaignsResult.data : [];

  // A lista de peças alimenta o seletor da campanha.
  const { data: rawProducts } = await supabase
    .from('products')
    .select('id, name, price_retail, category:categories(label)')
    .eq('active', true)
    .order('name');

  const products: PickerProduct[] = (rawProducts ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price_retail: Number(p.price_retail),
    category_label:
      (p.category as unknown as { label: string } | null)?.label ?? '—',
  }));

  // Quais peças estão em cada campanha, pra abrir o editor já marcado.
  const membership: Record<string, string[]> = {};
  if (!missingTable && campaigns.length > 0) {
    const { data: links } = await supabase
      .from('campaign_products')
      .select('campaign_id, product_id');
    for (const link of links ?? []) {
      (membership[link.campaign_id] ??= []).push(link.product_id);
    }
  }

  return (
    <AdminShell user={{ email: user.email ?? '' }} title="Campanhas">
      <div className="p-6">
        <CampaignsManager
          campaigns={campaigns}
          products={products}
          membership={membership}
          missingTable={missingTable}
        />
      </div>
    </AdminShell>
  );
}
