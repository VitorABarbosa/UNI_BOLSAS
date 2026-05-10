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
