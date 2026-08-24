'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SizesInput } from '@/components/admin/SizesInput';
import type { ProductInput } from '@/lib/validators/product';

export function PricingFields({ form }: { form: UseFormReturn<ProductInput> }) {
  // Mostrar o desconto enquanto se digita evita o erro clássico de trocar os
  // dois campos de lugar e publicar um "aumento" com cara de promoção.
  const retail = Number(form.watch('price_retail')) || 0;
  const promo = Number(form.watch('price_promo')) || 0;
  const discount =
    retail > 0 && promo > 0 && promo < retail
      ? Math.round((1 - promo / retail) * 100)
      : null;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="price_retail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preço varejo (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price_wholesale"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preço atacado</FormLabel>
            <FormControl>
              <Input
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
                placeholder='Ex: "12 unidades / R$ 89,90 cada"'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="rounded-md border border-whisper bg-bone-light/60 p-4 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-base text-ink">Promoção</h3>
          {discount != null && (
            <span className="rounded bg-wine px-2 py-1 font-sans text-[11px] font-medium tracking-wider text-bone">
              -{discount}%
            </span>
          )}
        </div>

        <FormField
          control={form.control}
          name="price_promo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço promocional (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                  placeholder="Vazio = sem promoção"
                />
              </FormControl>
              <p className="text-xs text-stone">
                O preço de varejo vira o valor riscado no site. Deixe vazio
                para encerrar a promoção.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="promo_ends_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Válida até (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <p className="text-xs text-stone">
                Passada a data, o site volta sozinho ao preço cheio — sem
                precisar lembrar de apagar o campo.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="sizes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tamanhos</FormLabel>
            <FormControl>
              <SizesInput value={field.value} onChange={field.onChange} name={field.name} />
            </FormControl>
            <p className="text-xs text-stone">
              Pelo menos 1 tamanho. Use “Único” se não houver variação.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
