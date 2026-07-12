import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Checking for ASWAS category...");
  
  let categoryId;
  const existingCategory = await client.fetch('*[_type == "category" && (name == "ASWAS" || name == "Aswas")][0]');
  
  if (existingCategory) {
    console.log(`Found existing ASWAS category with ID: ${existingCategory._id}`);
    categoryId = existingCategory._id;
  } else {
    console.log("Creating new ASWAS category...");
    const createdCategory = await client.create({
      _type: "category",
      name: "ASWAS",
      order: 100, // Giving it a high order number so it goes to the end of the list initially
    });
    console.log(`Created category ASWAS with ID: ${createdCategory._id}`);
    categoryId = createdCategory._id;
  }

  console.log("Fetching Aswas products...");
  const products = await client.fetch(
    '*[_type == "product" && (name match "ASWAS*" || name match "aswas*")]'
  );
  
  console.log(`Found ${products.length} products to move.`);
  
  if (products.length === 0) {
    console.log("No products found, nothing to do.");
    return;
  }

  console.log("Preparing transaction to patch products...");
  const transaction = client.transaction();
  
  for (const product of products) {
    transaction.patch(product._id, (p: any) => 
      p.set({
        category: {
          _type: "reference",
          _ref: categoryId,
        }
      })
    );
  }
  
  console.log("Committing transaction...");
  await transaction.commit();
  console.log("Successfully moved products to Aswas category!");
}

main().catch(console.error);
