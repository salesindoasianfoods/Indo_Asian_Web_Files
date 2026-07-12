import { createClient } from '@sanity/client';

const client = createClient({
    projectId: 'lz2bjis5',
    dataset: 'production',
    useCdn: false,
    token: 'sk2LtoD9uYtOmsX6K3LqSg5483rW4E9484K1fW4Y31x6E85R1t7K2u4X2q57J9p3A2b4F9b4T53a1Y74V81t81H2a2u91E44X21y3K3j6I4g3a1M12n8x8C49Q1n2u83s86X2q3R8x5L2o2s1q2D4E4G3p1H6E1d6O4T5',
    apiVersion: '2023-01-01',
});

async function main() {
    const products = await client.fetch(`*[_type == "product" && category->name match "Viswas*"][0] {..., category->}`);
    console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error);
