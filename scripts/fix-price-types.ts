import { createClient } from '@sanity/client';

const client = createClient({
    projectId: 'lz2bjis5',
    dataset: 'production',
    useCdn: false,
    token: 'skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp',
    apiVersion: '2023-01-01',
});

async function main() {
    const products = await client.fetch(`*[_type == "product" && price > 0] { _id, price }`);
    console.log(`Found ${products.length} products with numerical price`);
    
    let patched = 0;
    for (const p of products) {
        if (typeof p.price === 'number') {
            await client.patch(p._id).set({ price: p.price.toString() }).commit();
            patched++;
        }
    }
    console.log(`Patched ${patched} products back to string`);
}

main().catch(console.error);
