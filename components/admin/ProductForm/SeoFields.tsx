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
import { Textarea } from '@/components/ui/textarea';
import type { ProductInput } from '@/lib/validators/product';

const TITLE_MAX = 70;
const DESC_MAX = 160;

export function SeoFields({ form }: { form: UseFormReturn<ProductInput> }) {
  const seoTitle = form.watch('seo_title') ?? '';
  const seoDesc = form.watch('seo_description') ?? '';

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="seo_title"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-baseline justify-between">
              <FormLabel>SEO title</FormLabel>
              <span
                className={`text-xs ${seoTitle.length > TITLE_MAX ? 'text-wine' : 'text-stone'}`}
              >
                {seoTitle.length} / {TITLE_MAX}
              </span>
            </div>
            <FormControl>
              <Input
                value={field.value ?? ''}
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
        name="seo_description"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-baseline justify-between">
              <FormLabel>SEO description</FormLabel>
              <span
                className={`text-xs ${seoDesc.length > DESC_MAX ? 'text-wine' : 'text-stone'}`}
              >
                {seoDesc.length} / {DESC_MAX}
              </span>
            </div>
            <FormControl>
              <Textarea
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sort_order"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ordem</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                step="1"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
              />
            </FormControl>
            <p className="text-xs text-stone">
              Posição na listagem. Menor aparece primeiro.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
