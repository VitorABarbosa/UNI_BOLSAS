'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { slugify } from '@/lib/slug';
import type { ProductInput } from '@/lib/validators/product';

export function BasicFields({
  form,
  categories,
  mode,
}: {
  form: UseFormReturn<ProductInput>;
  categories: { id: string; label: string }[];
  mode: 'create' | 'edit';
}) {
  const [slugTouched, setSlugTouched] = useState(false);

  const handleNameChange = (value: string) => {
    form.setValue('name', value, { shouldDirty: true });
    if (mode === 'create' && !slugTouched) {
      form.setValue('slug', slugify(value), { shouldDirty: true, shouldValidate: false });
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input
                value={field.value}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slug (URL)</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                onChange={(e) => {
                  setSlugTouched(true);
                  field.onChange(e);
                }}
                className="font-mono text-sm"
              />
            </FormControl>
            <p className="text-xs text-stone">
              /produtos/{form.watch('slug') || '...'}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tagline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tagline</FormLabel>
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
        name="badge"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Badge</FormLabel>
            <FormControl>
              <Input
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                name={field.name}
                placeholder='Ex: "Novo", "Promo"'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="active"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-md border border-whisper p-3">
            <div>
              <FormLabel className="m-0">Ativo</FormLabel>
              <p className="text-xs text-stone">Visível no site público.</p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
