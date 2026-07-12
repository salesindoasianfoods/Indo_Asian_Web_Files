import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  apiVersion: "2023-05-03",
  useCdn: false,
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
});

const CATEGORY_ORDER = [
  "VISWAS FROZEN SNACKS",
  "VISWAS FROZEN BREADS & BREAKFAST",
  "VISWAS FROZEN VEG & RAW ITEMS",
  "VISWAS FROZEN CURRYS & THORAN",
  "VISWAS SNACKS",
  "VISWAS POWDERS & FLAKES",
  "VISWAS MASALAS & SPICES",
  "VISWAS PICKLES",
  "VISWAS CAKES",
  "VISWAS OTHER",
  "DAILY DELIGHT FROZEN SNACKS",
  "DAILY DELIGHT VEG & RAW FOODS",
  "DAILY DELIGHT BREADS & BREAKFAST",
  "DAILY DELIGHT SNACKS",
  "DAILY DELIGHT CURRYS & THOORAN",
  "DAILY DELIGHT FISH",
  "DAILY DELIGHT OTHER",
  "PERIYAR POWDERS & RICE",
  "CRISPY",
  "MALABAR CHOICE",
  "MC PULSES & SPICES",
  "MC RICES",
  "MC OILS",
  "MC POWDERS, FLAKES & OTHER",
  "EASTERN MASALA & OTHERS",
  "EASTERN POWDERS",
  "EASTERN PICKLES",
  "DOUBLE HORSE",
  "ID",
  "MELAM",
  "KERALA TASTE",
  "MARINE FRESH",
  "NEPTUNE FROZEN FISH",
  "FISH FROZEN OTHER",
  "SHANA",
  "MAGIC TASTES",
  "PULVERA",
  "TN Fish stuff",
  "HALDIRAM",
  "ROYAL DELICASY",
  "SARAS",
  "MAYIL",
  "TYJ",
  "TASTY NIBBLES",
  "PARLE",
  "GRB",
  "TOWN BUS",
  "MAGGI",
  "RICES (ALL BRANDS)",
  "CROCKERY",
  "OTHER ITEMS"
].map(c => c.toUpperCase().trim());

async function main() {
  try {
    const categories = await client.fetch(`*[_type == "category"]{name, _id}`);
    
    console.log(`Found ${categories.length} categories to sort.`);

    let mutations = [];
    let nextUnknownIndex = 0;

    for (const cat of categories) {
      const name = cat.name.toUpperCase().trim();
      let orderIndex = CATEGORY_ORDER.indexOf(name);
      
      let finalOrder = 0;
      if (orderIndex !== -1) {
          const ricesIndex = CATEGORY_ORDER.indexOf("RICES (ALL BRANDS)");
          
          if (orderIndex <= ricesIndex) {
              // Exact items up to RICES go from 0 to 4800
              finalOrder = orderIndex * 100;
          } else {
              // Exact items AFTER rices (Crockery, Other Items) go way at the bottom (8000+)
              finalOrder = 8000 + (orderIndex * 100);
          }
      } else {
          // Unknown items go exactly between Rices (4800) and Crockery (8000)
          finalOrder = 5000 + (nextUnknownIndex * 10);
          nextUnknownIndex++;
      }

      mutations.push({
        patch: {
          id: cat._id,
          set: {
            order: finalOrder
          }
        }
      });
    }

    // Execute mutations in a transaction
    await client.transaction(mutations).commit();
    console.log("Successfully updated all category ordering in Sanity!");

  } catch (error) {
    console.error("Error:", error);
  }
}

main();
