import { createClient } from "@sanity/client";
import { config } from "dotenv";
config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.NEXT_PUBLIC_SANITY_EDIT_TOKEN!,
  apiVersion: "2024-04-01",
  useCdn: false,
});

const categories = [
  { name: "HALDIRAM", order: 1 },
  { name: "KERALA TASTE", order: 2 },
  { name: "RICES (ALL BRANDS)", order: 3 },
  { name: "DOUBLE HORSE", order: 4 },
  { name: "MALABAR CHOICE", order: 5 },
  { name: "VISWAS SNACKS", order: 6 },
  { name: "EASTERN MASALA & OTHERS", order: 7 },
  { name: "CROCKERY", order: 8 },
  { name: "PERIYAR POWDERS & RICE", order: 9 },
  { name: "DAILY DELIGHT FROZEN SNACKS", order: 10 },
  { name: "DAILY DELIGHT BREADS & BREAKFAST", order: 11 },
  { name: "MAYIL", order: 12 },
  { name: "AHA GREEN VALLEY", order: 13 },
  { name: "SHANA", order: 14 },
  { name: "NEPTUNE FROZEN FISH", order: 15 },
  { name: "AQUA FRESH", order: 16 },
  { name: "EASTERN PICKLES", order: 17 },
  { name: "MC POWDERS, FLAKES & OTHER", order: 18 },
  { name: "MELAM", order: 19 },
  { name: "VISWAS FROZEN VEG & RAW ITEMS", order: 20 },
  { name: "VISWAS MASALAS & SPICES", order: 21 },
  { name: "VISWAS OTHER", order: 22 },
  { name: "TASTY NIBBLES", order: 23 },
  { name: "VISWAS FROZEN SNACKS", order: 24 },
  { name: "FISH FROZEN OTHER", order: 25 },
  { name: "SARAS", order: 26 },
  { name: "OTHER ITEMS", order: 27 },
  { name: "MARINE FRESH", order: 28 },
  { name: "TOWN BUS", order: 29 },
  { name: "VISWAS FROZEN BREADS & BREAKFAST", order: 30 },
  { name: "DAILY DELIGHT VEG & RAW FOODS", order: 31 },
  { name: "MAGIC TASTES", order: 32 },
  { name: "DAILY DELIGHT CURRYS & THOORAN", order: 33 },
  { name: "VISWAS FROZEN CURRYS & THORAN", order: 34 },
  { name: "VISWAS POWDERS & FLAKES", order: 35 },
  { name: "MC OILS", order: 36 },
  { name: "ROYAL DELICASY", order: 37 },
  { name: "BRAMINS", order: 38 },
  { name: "DAILY DELIGHT FISH", order: 39 },
  { name: "EASTERN POWDERS", order: 40 },
  { name: "MC COFFEE & OTHER", order: 41 },
  { name: "VISWAS PICKLES", order: 42 },
  { name: "CRISPY", order: 43 },
  { name: "MC PULSES & SPICES", order: 44 },
  { name: "PARLE", order: 45 },
  { name: "HUMZA", order: 46 },
  { name: "GRB SWEETS", order: 47 },
  { name: "DAILY DELIGHT SNACKS", order: 48 },
  { name: "SPICES & OTHERS", order: 49 },
  { name: "VISWAS CAKES", order: 50 },
  { name: "ID", order: 51 },
  { name: "DAILY DELIGHT OTHER", order: 52 },
  { name: "INDIA GATE RICE", order: 53 },
  { name: "PULVERA", order: 54 },
  { name: "MAGGI", order: 55 },
  { name: "TYJ", order: 56 },
  { name: "SNACKS & NOODLES", order: 57 },
  { name: "MC RICES", order: 58 },
  { name: "CF", order: 59 },
  { name: "TATA", order: 60 },
  { name: "SUVAI", order: 61 },
];

async function importCategories() {
  console.log(`Importing ${categories.length} categories...`);

  for (const cat of categories) {
    const doc = {
      _type: "category",
      name: cat.name,
      order: cat.order,
    };

    try {
      const result = await client.create(doc);
      console.log(`✓ Created: ${cat.name} (id: ${result._id})`);
    } catch (err: any) {
      console.error(`✗ Failed: ${cat.name} — ${err.message}`);
    }
  }

  console.log("\nDone!");
}

importCategories();
