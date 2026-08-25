'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createCampaign,
  deleteCampaign,
  setCampaignProducts,
  updateCampaign,
  type CampaignRow,
} from '@/app/admin/_actions/campaigns';
import { formatPriceBRL } from '@/lib/format';

export type PickerProduct = {
  id: string;
  name: string;
  price_retail: number;
  category_label: string;
};

type Props = {
  campaigns: CampaignRow[];
  products: PickerProduct[];
  /** ids das peças de cada campanha */
  membership: Record<string, string[]>;
  /** Migration ainda não aplicada — o painel explica em vez de quebrar. */
  missingTable: boolean;
};

const EMPTY_FORM = {
  name: '',
  discount_kind: 'percent' as 'percent' | 'fixed',
  discount_value: '20',
  starts_at: '',
  ends_at: '',
  active: true,
};

/** "2026-08-31T18:00" (local) -> ISO com fuso, que é o que o banco espera. */
function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO -> string local que o <input type="datetime-local"> aceita. */
function toLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CampaignsManager({
  campaigns,
  products,
  membership,
  missingTable,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (missingTable) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="font-serif text-lg text-ink">Campanhas</h2>
          <p className="max-w-2xl text-sm text-stone">
            As tabelas de campanha ainda não existem no banco. O site continua
            funcionando normalmente — só esta aba fica indisponível.
          </p>
          <p className="max-w-2xl text-sm text-stone">
            Para ativar, rode o conteúdo de{' '}
            <code className="rounded bg-bone-light px-1.5 py-0.5 font-mono text-xs">
              supabase/migrations/20260824000100_campaigns.sql
            </code>{' '}
            no editor SQL do Supabase. Pode ser a qualquer momento, sem parada.
          </p>
        </CardContent>
      </Card>
    );
  }

  const openNew = () => {
    setEditing('new');
    setForm(EMPTY_FORM);
    setSelected(new Set());
  };

  const openEdit = (c: CampaignRow) => {
    setEditing(c.id);
    setForm({
      name: c.name,
      discount_kind: c.discount_kind === 'fixed' ? 'fixed' : 'percent',
      discount_value: String(c.discount_value),
      starts_at: toLocal(c.starts_at),
      ends_at: toLocal(c.ends_at),
      active: c.active,
    });
    setSelected(new Set(membership[c.id] ?? []));
  };

  const save = () => {
    const current = editing;
    if (!current) return;
    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        discount_kind: form.discount_kind,
        discount_value: Number(form.discount_value.replace(',', '.')),
        starts_at: toIso(form.starts_at),
        ends_at: toIso(form.ends_at),
        active: form.active,
      };

      let campaignId = current;
      if (current === 'new') {
        const created = await createCampaign(payload);
        if (!created.ok) {
          toast.error(created.error);
          return;
        }
        campaignId = created.data.id;
      } else {
        const updated = await updateCampaign(current, payload);
        if (!updated.ok) {
          toast.error(updated.error);
          return;
        }
      }
      const linked = await setCampaignProducts(campaignId, [...selected]);
      if (!linked.ok) {
        toast.error(linked.error);
        return;
      }

      toast.success(
        `Campanha salva com ${linked.data.count} peça${linked.data.count === 1 ? '' : 's'}`,
      );
      setEditing(null);
      router.refresh();
    });
  };

  const remove = (c: CampaignRow) =>
    startTransition(async () => {
      const res = await deleteCampaign(c.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Campanha excluída');
      if (editing === c.id) setEditing(null);
      router.refresh();
    });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const discountValue = Number(form.discount_value.replace(',', '.')) || 0;
  const preview = (price: number) =>
    form.discount_kind === 'fixed'
      ? discountValue
      : Math.round(price * (1 - discountValue / 100) * 100) / 100;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg text-ink">Campanhas</h2>
          <p className="mt-1 max-w-2xl text-sm text-stone">
            Escolha as peças, defina o desconto e o período. O site mostra o
            preço com desconto, o cheio riscado e o selo — e volta sozinho ao
            normal quando a campanha termina.
          </p>
        </div>
        <Button onClick={openNew} disabled={pending}>
          Nova campanha
        </Button>
      </div>

      {campaigns.length > 0 && (
        <div className="overflow-hidden rounded-md border border-whisper">
          <table className="w-full text-sm">
            <thead className="bg-bone-light text-left text-xs uppercase tracking-wider text-stone">
              <tr>
                <th className="p-3">Campanha</th>
                <th className="p-3">Desconto</th>
                <th className="p-3">Período</th>
                <th className="p-3">Peças</th>
                <th className="p-3">Status</th>
                <th className="w-24 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-whisper">
                  <td className="p-3 text-ink">{c.name}</td>
                  <td className="p-3">
                    {c.discount_kind === 'fixed'
                      ? formatPriceBRL(c.discount_value)
                      : `-${c.discount_value}%`}
                  </td>
                  <td className="p-3 text-stone">
                    {c.starts_at || c.ends_at
                      ? `${c.starts_at ? new Date(c.starts_at).toLocaleDateString('pt-BR') : 'já valendo'} → ${c.ends_at ? new Date(c.ends_at).toLocaleDateString('pt-BR') : 'sem prazo'}`
                      : 'sem prazo'}
                  </td>
                  <td className="p-3 tabular-nums">{c.product_count}</td>
                  <td className="p-3">
                    <Badge variant={c.active ? 'default' : 'secondary'}>
                      {c.active ? 'Ativa' : 'Pausada'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(c)}
                        disabled={pending}
                      >
                        Editar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Excluir ${c.name}`}
                        onClick={() => remove(c)}
                        disabled={pending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <h3 className="font-serif text-base text-ink">
              {editing === 'new' ? 'Nova campanha' : 'Editar campanha'}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5 text-sm">
                <span className="text-stone">Nome</span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Dia das Mães"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-stone">Tipo de desconto</span>
                <Select
                  value={form.discount_kind}
                  onValueChange={(v) =>
                    setForm({ ...form, discount_kind: v as 'percent' | 'fixed' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Preço fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-stone">
                  {form.discount_kind === 'fixed' ? 'Preço (R$)' : 'Desconto (%)'}
                </span>
                <Input
                  type="number"
                  min="0"
                  step={form.discount_kind === 'fixed' ? '0.01' : '1'}
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm text-stone">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
                Campanha ativa
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-stone">Começa em (opcional)</span>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-stone">Termina em (opcional)</span>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-ink">
                  Peças na campanha ({selected.size})
                </span>
                <Input
                  placeholder="Buscar bolsa…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelected(new Set(filteredProducts.map((p) => p.id)))
                  }
                >
                  Marcar os {filteredProducts.length} listados
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                >
                  Limpar
                </Button>
              </div>

              <div className="max-h-[360px] overflow-y-auto rounded-md border border-whisper">
                <table className="w-full text-sm">
                  <tbody>
                    {filteredProducts.map((p) => {
                      const on = selected.has(p.id);
                      const novo = preview(p.price_retail);
                      return (
                        <tr key={p.id} className="border-b border-whisper last:border-0">
                          <td className="w-10 p-2">
                            <input
                              type="checkbox"
                              aria-label={`Incluir ${p.name}`}
                              checked={on}
                              onChange={() => toggle(p.id)}
                              className="h-4 w-4 cursor-pointer accent-ink"
                            />
                          </td>
                          <td className="p-2 text-ink">{p.name}</td>
                          <td className="p-2 text-xs text-stone">
                            {p.category_label}
                          </td>
                          <td className="whitespace-nowrap p-2 text-right">
                            {on && novo > 0 && novo < p.price_retail ? (
                              <span>
                                <s className="text-stone">
                                  {formatPriceBRL(p.price_retail)}
                                </s>{' '}
                                <strong className="text-wine">
                                  {formatPriceBRL(novo)}
                                </strong>
                              </span>
                            ) : (
                              <span className="text-stone">
                                {formatPriceBRL(p.price_retail)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={save} disabled={pending}>
                Salvar campanha
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditing(null)}
                disabled={pending}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
