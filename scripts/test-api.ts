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

function parsePrice(priceStr: any): number | null {
    if (!priceStr) return null;
    const num = parseFloat(priceStr.replace(/[^\d.]/g, ""));
    return Number.isNaN(num) ? null : num;
}

async function main() {
    const query = `*[_type == "product"] | order(_createdAt asc) ${productProjection}`;
    try {
        console.log("Fetching products...");
        const records = await client.fetch(query);
        console.log(`Fetched ${records.length} products.`);

        let crashed = false;
        const filtered = records.filter((record: any) => {
            try {
                parsePrice(record.price);
                return true;
            } catch (e: any) {
                console.error(`Crash on product ${record._id}:`, e.message);
                console.error("Price value:", record.price);
                crashed = true;
                return false;
            }
        });

        if (!crashed) {
            console.log("No products crashed parsePrice.");
        }
    } catch (e) {
        console.error("GROQ Error:", e);
    }
}

main().catch(console.error);
