export const CATALOG_PAGE_SIZE = 24;

export type CatalogMetadata = {
  weightOptions: string[];
  tagOptions: string[];
  unitOptions: string[];
  globalMinPrice: number | null;
  globalMaxPrice: number | null;
};

export type CatalogMetaProduct = {
  weight?: string;
  badge?: string;
  unit?: string;
  price?: string;
};

export function parsePrice(priceStr?: string): number | null {
  if (!priceStr) return null;
  const num = parseFloat(priceStr.replace(/[^\d.]/g, ""));
  return Number.isNaN(num) ? null : num;
}

function uniqueSorted(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))
  ).sort((a, b) => a.localeCompare(b));
}

export function deriveCatalogMetadata(products: CatalogMetaProduct[]): CatalogMetadata {
  const prices = products
    .map((product) => parsePrice(product.price))
    .filter((value): value is number => value !== null);

  return {
    weightOptions: uniqueSorted(products.map((product) => product.weight)),
    tagOptions: uniqueSorted(products.map((product) => product.badge)),
    unitOptions: uniqueSorted(products.map((product) => product.unit)),
    globalMinPrice: prices.length > 0 ? Math.min(...prices) : null,
    globalMaxPrice: prices.length > 0 ? Math.max(...prices) : null,
  };
}

export const productProjection = `{
  _id,
  name,
  "slug": slug.current,
  code,
  unit,
  weight,
  price,
  badge,
  outOfStock,
  "image": image.asset->url,
  "categoryId": category._ref
}`;

export const heroQuery = `*[_type == "heroSlider"][0].images[]{
  "id": _key,
  "image": asset->url,
  alt
}`;

export const categoriesWithCountsQuery = `*[_type == "category"] | order(order asc) {
  _id,
  name,
  order,
  "count": count(*[_type == "product" && category._ref == ^._id])
}`;

export const productMetadataQuery = `*[_type == "product"] {
  weight,
  badge,
  unit,
  price
}`;

export const totalProductCountQuery = `count(*[_type == "product"])`;

export const newArrivalsQuery = `*[_type == "newArrivals"][0].images[]{
  "id": _key,
  "image": asset->url
}`;
