import "./home.scss";
import {
  ShopPageScreen,
  HeroSlide,
  SanityCategory,
  SanityProduct,
} from "@/components/shop-page/ShopPageScreen";
import { client } from "@/sanity/lib/client";
import {
  CATALOG_PAGE_SIZE,
  type CatalogMetadata,
  categoriesWithCountsQuery,
  deriveCatalogMetadata,
  heroQuery,
  productMetadataQuery,
  productProjection,
  totalProductCountQuery,
  newArrivalsQuery,
} from "@/sanity/lib/catalog";

export const revalidate = 60;

export default async function Home() {
  let fetchedSlides: HeroSlide[] | undefined;
  let fetchedCategories: SanityCategory[] = [];
  let initialProducts: SanityProduct[] = [];
  let totalProductCount = 0;
  let hasNewArrivals = false;
  let catalogMetadata: CatalogMetadata = {
    weightOptions: [],
    tagOptions: [],
    unitOptions: [],
    globalMinPrice: null,
    globalMaxPrice: null,
  };

  try {
    const [heroData, categoriesData, metadataProducts, totalCount, productsData, newArrivalsData] = await Promise.all([
      client.fetch(heroQuery),
      client.fetch(categoriesWithCountsQuery),
      client.fetch(productMetadataQuery),
      client.fetch(totalProductCountQuery),
      client.fetch(`*[_type == "product"] | order(_createdAt asc)[0...$limit] ${productProjection}`, { limit: CATALOG_PAGE_SIZE }),
      client.fetch(newArrivalsQuery),
    ]);

    if (heroData && Array.isArray(heroData) && heroData.length > 0) {
      fetchedSlides = heroData;
    }
    if (categoriesData && Array.isArray(categoriesData)) {
      fetchedCategories = categoriesData;
    }
    if (metadataProducts && Array.isArray(metadataProducts)) {
      catalogMetadata = deriveCatalogMetadata(metadataProducts);
    }
    if (typeof totalCount === "number") {
      totalProductCount = totalCount;
    }
    if (productsData && Array.isArray(productsData)) {
      initialProducts = productsData;
    }
    if (newArrivalsData && Array.isArray(newArrivalsData) && newArrivalsData.length > 0) {
      hasNewArrivals = true;
    }
  } catch (error) {
    console.error("Failed to fetch data from Sanity:", error);
  }

  return (
    <div className="shop-page-container-main flex items-center justify-center">
      <div className="shop-page-container container">
        <ShopPageScreen
          catalogMetadata={catalogMetadata}
          heroSlides={fetchedSlides}
          categories={fetchedCategories}
          initialProducts={initialProducts}
          pageSize={CATALOG_PAGE_SIZE}
          totalProductCount={totalProductCount}
          hasNewArrivals={hasNewArrivals}
        />
      </div>
    </div>
  );
}
