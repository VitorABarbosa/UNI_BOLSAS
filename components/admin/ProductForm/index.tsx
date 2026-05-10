'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Path, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductSchema, type ProductInput } from '@/lib/validators/product';
import { createProduct, updateProduct } from '@/app/admin/_actions/products';
import { BasicFields } from './BasicFields';
import { PricingFields } from './PricingFields';
import { DetailsFields } from './DetailsFields';
import { SeoFields } from './SeoFields';
import { ColorsEditor, type ColorRow } from './ColorsEditor';

const TABS = [
  { value: 'basico', label: 'Básico' },
  { value: 'preco', label: 'Preço' },
  { value: 'detalhes', label: 'Detalhes' },
  { value: 'seo', label: 'SEO' },
  { value: 'cores', label: 'Cores' },
  { value: 'imagens', label: 'Imagens' },
] as const;

export type ProductRowFull = ProductInput & {
  id: string;
  // colors/images shape comes from /[id]/page query — typed loosely, used by
  // ColorsEditor/ImagesEditor in tasks 14/15
  colors?: unknown[];
  images?: unknown[];
};

function defaultsForCreate(
  categories: { id: string; label: string }[],
): ProductInput {
  return {
    name: '',
    slug: '',
    tagline: null,
    description: null,
    category_id: categories[0]?.id ?? '',
    badge: null,
    price_retail: 0,
    price_wholesale: null,
    dimensions: null,
    weight: null,
    material: null,
    sizes: ['Único'],
    active: true,
    sort_order: 0,
    seo_title: null,
    seo_description: null,
  };
}

export function ProductForm({
  mode,
  categories,
  product,
  initialColors,
}: {
  mode: 'create' | 'edit';
  categories: { id: string; label: string }[];
  product?: ProductRowFull;
  initialColors?: ColorRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initialValues: ProductInput = product
    ? {
        name: product.name,
        slug: product.slug,
        tagline: product.tagline ?? null,
        description: product.description ?? null,
        category_id: product.category_id,
        badge: product.badge ?? null,
        price_retail: product.price_retail,
        price_wholesale: product.price_wholesale ?? null,
        dimensions: product.dimensions ?? null,
        weight: product.weight ?? null,
        material: product.material ?? null,
        sizes: product.sizes,
        active: product.active,
        sort_order: product.sort_order,
        seo_title: product.seo_title ?? null,
        seo_description: product.seo_description ?? null,
      }
    : defaultsForCreate(categories);

  const form = useForm<ProductInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ProductSchema as any) as unknown as Resolver<ProductInput>,
    defaultValues: initialValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === 'edit' && product
          ? await updateProduct(product.id, values)
          : await createProduct(values);

      if (result.ok) {
        toast.success(mode === 'edit' ? 'Produto atualizado' : 'Produto criado');
        if (mode === 'create' && 'data' in result && result.data) {
          router.push(`/admin/produtos/${result.data.id}`);
        } else {
          // edit success: keep edits in form, just refetch RSC
          form.reset(values);
          router.refresh();
        }
      } else {
        Object.entries(result.fieldErrors ?? {}).forEach(([field, msgs]) =>
          form.setError(field as Path<ProductInput>, { message: msgs?.[0] }),
        );
        toast.error(result.error);
      }
    });
  });

  const isCreate = mode === 'create';
  const dirty = form.formState.isDirty;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Tabs defaultValue="basico">
          <TabsList className="mx-6 mt-4">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-6 pb-24">
            <TabsContent value="basico">
              <BasicFields form={form} categories={categories} mode={mode} />
            </TabsContent>
            <TabsContent value="preco">
              <PricingFields form={form} />
            </TabsContent>
            <TabsContent value="detalhes">
              <DetailsFields form={form} />
            </TabsContent>
            <TabsContent value="seo">
              <SeoFields form={form} />
            </TabsContent>
            <TabsContent value="cores">
              {isCreate ? (
                <p className="rounded-md border border-whisper bg-bone-light p-4 text-sm text-stone">
                  Salve o produto primeiro pra liberar a edição de cores.
                </p>
              ) : (
                <ColorsEditor productId={product!.id} initial={initialColors ?? []} />
              )}
            </TabsContent>
            <TabsContent value="imagens">
              {isCreate ? (
                <p className="rounded-md border border-whisper bg-bone-light p-4 text-sm text-stone">
                  Salve o produto primeiro pra liberar o upload de imagens.
                </p>
              ) : (
                <p className="rounded-md border border-whisper bg-bone-light p-4 text-sm text-stone">
                  Editor de imagens virá na Task 15.
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Sticky footer */}
        <div className="sticky bottom-0 left-0 right-0 flex justify-end gap-2 border-t border-whisper bg-pearl px-6 py-3">
          <Button type="submit" disabled={!dirty || pending}>
            {pending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
