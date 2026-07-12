import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.NEXT_PUBLIC_SANITY_EDIT_TOKEN!,
  apiVersion: "2024-04-01",
  useCdn: false,
});

const imageMappings = [
  { code: "TNANCHOVYMARINATED", path: "product-files/new-product-3/marinated-anchovy.jpeg" },
  { code: "TNANGMANGOFRO", path: "product-files/new-product-3/angamalu-manga-curry.jpeg" },
  { code: "TNFISHBIRIYANIMAHI", path: "product-files/new-product-3/WhatsApp Image 2026-06-04 at 12.59.15.jpeg" },
  { code: "TNFISHMASALA", path: "product-files/new-product-3/WhatsApp Image 2026-06-04 at 12.59.14 (3).jpeg" },
  { code: "TNFISHMOILEEMAHI", path: "product-files/new-product-3/WhatsApp Image 2026-06-04 at 12.59.14.jpeg" },
  { code: "TNFISHPOLLICHATHU", path: "product-files/new-product-3/fish-pollichathu.jpeg" },
  { code: "TNFISHROAST", path: "product-files/new-product-3/WhatsApp Image 2026-06-04 at 12.59.14 (5).jpeg" },
  { code: "TNKERALAFISHSHAPILECURRY", path: "product-files/new-product-3/kerala-fish-curry.jpeg" },
  { code: "TNKILIMEENCLEANED", path: "product-files/new-product-3/threadifin-bream.jpeg" },
  { code: "TNKINGFISHCURRY", path: "product-files/new-product-3/king-fish-curry.jpeg" },
  { code: "TNKOOTUCURRYFRO", path: "product-files/new-product-3/WhatsApp Image 2026-06-04 at 12.59.14 (4).jpeg" },
  { code: "TNMACKERELMARINATED", path: "product-files/new-product-3/WhatsApp Image 2026-06-04 at 12.59.14 (2).jpeg" },
  { code: "TNMACKERELMULAKITTATHU", path: "product-files/new-product-3/mackarel-curry.jpeg" },
  { code: "TNPRAWNBIRIYANI", path: "product-files/new-product-3/prawns-biriyani.png" },
  { code: "TNPRAWNROAST", path: "product-files/new-product-3/prawns-roast.png" },
  { code: "TNSAILFISHCURRYCUT", path: "product-files/new-product-3/sail-fish-600g.jpeg" },
  { code: "TNSARDINEMARINATED", path: "product-files/new-product-3/marinated-sardine.jpeg" },
  { code: "TNSARDINEMULAKITTATHU", path: "product-files/new-product-3/WhatsApp Image 2026-06-04 at 12.59.15 (1).jpeg" }
];

async function uploadImage(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function main() {
  console.log("Starting image upload and mapping...");

  for (const item of imageMappings) {
    if (!fs.existsSync(item.path)) {
      console.error(`[ERROR] File does not exist: ${item.path}`);
      continue;
    }

    // 1. Fetch product to make sure it exists
    const product = await client.fetch(
      `*[_type == "product" && code == $code][0] { _id, name }`,
      { code: item.code }
    );

    if (!product) {
      console.warn(`[WARNING] Product with code "${item.code}" not found in Sanity. Skipping.`);
      continue;
    }

    console.log(`Uploading image for: ${product.name} (Code: ${item.code})...`);

    try {
      // 2. Upload image asset
      const assetId = await uploadImage(item.path);
      console.log(`  ✓ Image uploaded successfully (Asset ID: ${assetId})`);

      // 3. Attach image reference to product
      await client
        .patch(product._id)
        .set({
          image: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: assetId,
            },
          },
        })
        .commit();
      console.log(`  ✓ Image linked to product.`);
    } catch (err: any) {
      console.error(`  ✗ [ERROR] Failed to process ${item.code}: ${err.message}`);
    }
  }

  console.log("\nImage upload and linking completed successfully!");
}

main().catch(console.error);
