import { createClient } from '@sanity/client';

const client = createClient({
    projectId: 'lz2bjis5',
    dataset: 'production',
    useCdn: false,
    token: 'skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp',
    apiVersion: '2023-01-01',
});

const productProjection = `{
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

async function main() {
    const query = `*[_type == "product"
      && ($categoryId == "" || category._ref == $categoryId)
      && ($search == "" || name match $search || code match $search || unit match $search || weight match $search)
      && (count($units) == 0 || unit in $units)
      && (count($weights) == 0 || weight in $weights)
      && (count($tags) == 0 || badge in $tags)
    ] | order(_createdAt asc) ${productProjection}`;

    try {
        const result = await client.fetch(query, {
            categoryId: "",
            search: "",
            units: [],
            weights: [],
            tags: [],
        });
        console.log(`Successfully fetched ${result.length} products`);
        if (result.length > 0) {
            console.log(result[0]);
        }
    } catch (e) {
        console.error("GROQ ERROR:", e);
    }
}

main().catch(console.error);
