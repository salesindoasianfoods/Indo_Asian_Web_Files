import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  const products = await client.fetch(
    '*[_type == "product" && (name match "ASWAS*" || name match "aswas*")]{_id, name, code, "categoryName": category->name}'
  );
  console.log(`Found ${products.length} Aswas products:`);
  products.forEach((p: any, i: number) => {
    console.log(`${i + 1}. ${p.name} (Code: ${p.code}) - Current Category: ${p.categoryName || 'None'}`);
  });
}

main().catch(console.error);
