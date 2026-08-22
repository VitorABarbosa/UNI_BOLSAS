import 'server-only';
import { shopeeShopGet, type ShopeeBaseResponse } from './client';
import { shopeeItemUrl, type ShopeeRegion } from './config';

/**
 * Read side of the integration: pulls the shop's items with price + stock.
 *
 * Three endpoints are involved because Shopee splits the data:
 *   get_item_list       -> the item ids (paginated)
 *   get_item_base_info  -> name, images, status, and price/stock for items
 *                          WITHOUT variations (batches of 50)
 *   get_model_list      -> price/stock per SKU, for items WITH variations
 */

const PATH_ITEM_LIST = '/api/v2/product/get_item_list';
const PATH_ITEM_BASE_INFO = '/api/v2/product/get_item_base_info';
const PATH_MODEL_LIST = '/api/v2/product/get_model_list';

const LIST_PAGE_SIZE = 100;
const BASE_INFO_BATCH = 50;
/** Statuses worth mirroring. The public site only renders NORMAL ones. */
const WANTED_STATUS = ['NORMAL', 'UNLIST'];
/** Runaway guard — the shop is a bag maker, not a 10k-SKU marketplace. */
const MAX_ITEMS = 1000;

export type ShopAuth = { shopId: number; accessToken: string };

export type ShopeeItemSnapshot = {
  itemId: number;
  name: string;
  sku: string | null;
  status: string;
  currency: string;
  /** Lowest current price across models, in BRL. */
  price: number | null;
  originalPrice: number | null;
  /** Total available stock across models; null when Shopee omits it. */
  stock: number | null;
  imageUrl: string | null;
  itemUrl: string;
  hasModel: boolean;
  updateTime: string | null;
};

type ItemListResponse = ShopeeBaseResponse & {
  response?: {
    item?: { item_id: number; item_status: string; update_time?: number }[];
    total_count?: number;
    has_next_page?: boolean;
    next_offset?: number;
  };
};

type PriceInfo = {
  currency?: string;
  current_price?: number;
  original_price?: number;
};

type StockInfoV2 = {
  summary_info?: {
    total_available_stock?: number;
    total_reserved_stock?: number;
  };
};

type BaseInfoResponse = ShopeeBaseResponse & {
  response?: {
    item_list?: {
      item_id: number;
      item_name?: string;
      item_sku?: string;
      item_status?: string;
      has_model?: boolean;
      update_time?: number;
      image?: { image_url_list?: string[] };
      price_info?: PriceInfo[];
      stock_info_v2?: StockInfoV2;
    }[];
  };
};

type ModelListResponse = ShopeeBaseResponse & {
  response?: {
    model?: {
      model_id?: number;
      model_status?: string;
      price_info?: PriceInfo[];
      stock_info_v2?: StockInfoV2;
    }[];
  };
};

/** Full catalog snapshot for one authorized shop. */
export async function fetchShopCatalog(
  auth: ShopAuth,
  region: ShopeeRegion,
): Promise<ShopeeItemSnapshot[]> {
  const ids = await fetchItemIds(auth);
  const snapshots: ShopeeItemSnapshot[] = [];

  for (let i = 0; i < ids.length; i += BASE_INFO_BATCH) {
    const batch = ids.slice(i, i + BASE_INFO_BATCH);
    const res = await shopeeShopGet<BaseInfoResponse>(
      PATH_ITEM_BASE_INFO,
      auth,
      { item_id_list: batch.join(',') },
    );

    for (const item of res.response?.item_list ?? []) {
      const price = pickPrice(item.price_info);
      const stock = item.stock_info_v2?.summary_info?.total_available_stock;

      // Items with variations report price/stock per model, not on the item.
      const needsModels =
        (item.has_model ?? false) && (price.current === null || stock === undefined);
      const models = needsModels ? await fetchModelAggregate(auth, item.item_id) : null;

      snapshots.push({
        itemId: item.item_id,
        name: item.item_name ?? `Item ${item.item_id}`,
        sku: item.item_sku?.trim() ? item.item_sku.trim() : null,
        status: item.item_status ?? 'NORMAL',
        currency: price.currency ?? models?.currency ?? 'BRL',
        price: price.current ?? models?.price ?? null,
        originalPrice: price.original ?? models?.originalPrice ?? null,
        stock: stock ?? models?.stock ?? null,
        imageUrl: item.image?.image_url_list?.[0] ?? null,
        itemUrl: shopeeItemUrl(auth.shopId, item.item_id, region),
        hasModel: item.has_model ?? false,
        updateTime: item.update_time
          ? new Date(item.update_time * 1000).toISOString()
          : null,
      });
    }
  }

  return snapshots;
}

async function fetchItemIds(auth: ShopAuth): Promise<number[]> {
  const ids: number[] = [];
  let offset = 0;

  for (;;) {
    const res = await shopeeShopGet<ItemListResponse>(PATH_ITEM_LIST, auth, {
      offset: String(offset),
      page_size: String(LIST_PAGE_SIZE),
      item_status: WANTED_STATUS,
    });

    for (const item of res.response?.item ?? []) ids.push(item.item_id);

    if (ids.length >= MAX_ITEMS) {
      console.warn(
        `[shopee] catálogo truncado em ${MAX_ITEMS} itens — aumente MAX_ITEMS se a loja cresceu`,
      );
      return ids.slice(0, MAX_ITEMS);
    }
    if (!res.response?.has_next_page) return ids;

    // next_offset is authoritative; fall back to manual paging if absent.
    offset = res.response.next_offset ?? offset + LIST_PAGE_SIZE;
  }
}

/** Cheapest live model + summed stock, for items with variations. */
async function fetchModelAggregate(
  auth: ShopAuth,
  itemId: number,
): Promise<{
  price: number | null;
  originalPrice: number | null;
  stock: number | null;
  currency: string | null;
} | null> {
  let res: ModelListResponse;
  try {
    res = await shopeeShopGet<ModelListResponse>(PATH_MODEL_LIST, auth, {
      item_id: String(itemId),
    });
  } catch (err) {
    console.warn(`[shopee] get_model_list falhou para o item ${itemId}:`, err);
    return null;
  }

  const models = (res.response?.model ?? []).filter(
    (m) => m.model_status !== 'MODEL_DELETED',
  );
  if (models.length === 0) return null;

  let price: number | null = null;
  let originalPrice: number | null = null;
  let currency: string | null = null;
  let stock: number | null = null;

  for (const model of models) {
    const p = pickPrice(model.price_info);
    if (p.current !== null && (price === null || p.current < price)) {
      price = p.current;
      originalPrice = p.original;
      currency = p.currency;
    }
    const modelStock = model.stock_info_v2?.summary_info?.total_available_stock;
    if (typeof modelStock === 'number') stock = (stock ?? 0) + modelStock;
  }

  return { price, originalPrice, stock, currency };
}

function pickPrice(list: PriceInfo[] | undefined): {
  current: number | null;
  original: number | null;
  currency: string | null;
} {
  const first = list?.[0];
  return {
    current: typeof first?.current_price === 'number' ? first.current_price : null,
    original: typeof first?.original_price === 'number' ? first.original_price : null,
    currency: first?.currency ?? null,
  };
}
