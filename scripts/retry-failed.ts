import { createClient } from "@sanity/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: process.env.NEXT_PUBLIC_SANITY_EDIT_TOKEN2,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const PLACEHOLDER_IMAGE_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";

const products = [
  { code: "MAGGIF", name: "MAGIE NOODLES FAMILY PACK 280GM X 24", weight: "280G", price: "22.99", category: "MAGGI" },
  { code: "MLPEANUTB", name: "MAYIL PEANUT BALL 200GM X 30", weight: "200G", price: "41.70", category: "MAYIL" },
];

async function retry() {
  const categories = await client.fetch(`*[_type == "category"]{_id, name}`);
  const catMap = new Map(categories.map((c: any) => [c.name, c._id]));

  for (const p of products) {
    const unitMatch = p.name.match(/\b[xX]\s*(\d+|\d+\s*[xX]\s*\d+)\b/);
    const unit = unitMatch ? `X${unitMatch[1].replace(/\s/g, '').toUpperCase()}` : undefined;

    const doc: any = {
      _type: "product",
      name: p.name,
      code: p.code,
      weight: p.weight,
      price: `£ ${p.price}`,
      unit,
      image: { _type: "image", asset: { _type: "reference", _ref: PLACEHOLDER_IMAGE_REF } },
    };

    const catId = catMap.get(p.category);
    if (catId) doc.category = { _type: "reference", _ref: catId };

    try {
      const result = await client.create(doc);
      console.log(`✓ Created: ${p.code} -> ${result._id}`);
    } catch (err: any) {
      console.log(`✗ Failed: ${p.code} — ${err.message}`);
    }
  }
}

retry();
