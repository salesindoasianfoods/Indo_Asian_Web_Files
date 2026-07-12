import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { parsePrice, productProjection } from "@/sanity/lib/catalog";

const MAX_LIMIT = 40;

type ProductRecord = {
  _id: string;
  name: string;
  slug?: string;
  code: string;
  unit?: string;
  weight?: string;
  price?: string;
  badge?: string;
  outOfStock?: boolean;
  image?: string;
  categoryId?: string;
};

function clampInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const offset = clampInteger(searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);
    const limit = clampInteger(searchParams.get("limit"), 24, 1, MAX_LIMIT);
    const categoryId = searchParams.get("categoryId")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";
    const units = parseListParam(searchParams.get("units"));
    const weights = parseListParam(searchParams.get("weights"));
    const tags = parseListParam(searchParams.get("tags"));
    const priceMinRaw = searchParams.get("priceMin");
    const priceMaxRaw = searchParams.get("priceMax");
    const priceMin = priceMinRaw ? Number.parseFloat(priceMinRaw) : null;
    const priceMax = priceMaxRaw ? Number.parseFloat(priceMaxRaw) : null;

    const query = `*[_type == "product"
      && ($categoryId == "" || category._ref == $categoryId)
      && ($search == "" || name match $search || code match $search || unit match $search || weight match $search)
      && (count($units) == 0 || unit in $units)
      && (count($weights) == 0 || weight in $weights)
      && (count($tags) == 0 || badge in $tags)
    ] | order(_createdAt asc) ${productProjection}`;

    const records = await client.fetch<ProductRecord[]>(query, {
      categoryId,
      search: search ? `*${search}*` : "",
      units,
      weights,
      tags,
    });

    const filteredByPrice = records.filter((record) => {
      const price = parsePrice(record.price);
      if (price === null) return true;
      if (priceMin !== null && !Number.isNaN(priceMin) && price < priceMin) return false;
      if (priceMax !== null && !Number.isNaN(priceMax) && price > priceMax) return false;
      return true;
    });

    const total = filteredByPrice.length;
    const products = filteredByPrice.slice(offset, offset + limit);
    const nextOffset = offset + products.length;

    return NextResponse.json({
      products,
      total,
      hasMore: nextOffset < total,
      nextOffset,
    });
  } catch (error) {
    console.error("[api/products] Failed to load products:", error);
    return NextResponse.json(
      {
        products: [],
        total: 0,
        hasMore: false,
        nextOffset: 0,
        error: "Failed to load products",
      },
      { status: 500 }
    );
  }
}
