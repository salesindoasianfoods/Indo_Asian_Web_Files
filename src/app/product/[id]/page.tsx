import { notFound } from "next/navigation";
import "../../product-detail/style.scss";
import {
  ProductDetailScreen,
  ProductDetailData,
  RelatedProduct,
} from "@/components/product-detail/ProductDetailScreen";
import { client } from "@/sanity/lib/client";
import { unstable_noStore } from "next/cache";

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  unstable_noStore(); // ensure fresh Sanity data on every request
  const { id } = await params;

  // Fetch by _id — works for all existing products immediately
  const productQuery = `*[_type == "product" && _id == $id][0] {
    _id,
    name,
    "slug": slug.current,
    code,
    unit,
    weight,
    price,
    badge,
    "image": image.asset->url,
    "categoryName": category->name,
    "categoryId": category._ref
  }`;

  // Fetch related products from the same category (excluding this one)
  const relatedQuery = `*[_type == "product" && _id != $id && category._ref == $categoryId] | order(_createdAt asc)[0..4] {
    _id,
    name,
    "slug": slug.current,
    code,
    unit,
    weight,
    price,
    "image": image.asset->url
  }`;

  let product: ProductDetailData | null = null;
  let relatedProducts: RelatedProduct[] = [];

  try {
    product = await client.fetch(productQuery, { id });

    if (product?.categoryId) {
      relatedProducts = await client.fetch(relatedQuery, {
        id,
        categoryId: product.categoryId,
      });
    }
  } catch (error) {
    console.error("Failed to fetch product:", error);
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="product-detail-page-container-main flex items-center justify-center">
      <div className="product-detail-page-container container">
        <ProductDetailScreen product={product} relatedProducts={relatedProducts} />
      </div>
    </div>
  );
}
