import fs from "fs";
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

// Map of codes to their correct local image paths
const imagesToMap = [
  {
    code: "VSNEYYAP",
    path: "product-files/new proudcts/PRODUCTS LIST/Viswas Frozen Products/Viswas frozen snacks/family pack/VSNEYYAP  neyyappam family pack.png",
  },
  {
    code: "VSUNNIY",
    path: "product-files/new proudcts/PRODUCTS LIST/Viswas Frozen Products/Viswas frozen snacks/family pack/VSUNNIY unniyappam family.png",
  },
  {
    code: "VSBANFRY908",
    path: "product-files/new proudcts/PRODUCTS LIST/Viswas Frozen Products/Viswas frozen snacks/family pack/VSBANFRY908 banana fry family.png",
  },
  {
    code: "VSCUTFAM",
    path: "product-files/new proudcts/PRODUCTS LIST/Viswas Frozen Products/Viswas frozen snacks/family pack/VSCUTFAM  vegetable cutlet family pack.png",
  },
  {
    code: "VSKUMBILFA",
    path: "product-files/new proudcts/PRODUCTS LIST/Viswas Frozen Products/Viswas frozen snacks/family pack/kumbilappam family pack.png",
  },
  {
    code: "VSIDIYAFAM",
    path: "product-files/new proudcts/PRODUCTS LIST/Viswas Frozen Products/Viswas frozen snacks/family pack/VSIDIYAFAM idiyappam family pack.png",
  },
  {
    code: "VSPALAP8",
    path: "product-files/new proudcts/PRODUCTS LIST/Viswas Frozen Products/Viswas frozen snacks/family pack/VSPALAP8  palappam family.png",
  },
  {
    code: "VSBAB",
    path: "product-files/new proudcts/PRODUCTS LIST/Viswas Dry products/Bottle snacks/VSBAB banana chips bottle.png",
  },
  {
    code: "AQGOLDP",
    path: "product-files/new proudcts/PRODUCTS LIST/MARINE SEA FRESH/MSGOLDPOMP.jpeg",
  },
  {
    code: "GOL",
    path: "product-files/new proudcts/PRODUCTS LIST/MARINE SEA FRESH/MSGOLDPOMP.jpeg",
    newName: "AQ GOLDEN POMFRET 400G/600GM 10KG",
  },
];

// List of product codes where wrong images should be cleared (image set to null)
const codesToClear = [
  "GAR-M",       // GR Garam Masala 200g x 20pkt
  "HOTLI-M",     // GR Hot Lime Pickle 400g x12
  "PARACOC2-M",  // Parachute Coconut Oil 250 ML
  "AQREDMU",     // AQ Red Mullet 2KG x3
  "AQSQUDR",     // AQ Squid Ring 600g x15
  "BRPUT-M",     // BR Puttu Podi White 1kg x12
  "BRSAMW-M",     // BR Samba wheat broken 500g x24
  "CFPARATHF",   // CF Plain Family Pack 20 PCS
  "APPAMC",      // Appam Chatti Visalam
  "CHAPP",       // Chappathy Press (A One)
  "MUL-M",       // Mullu Murukku 180g x 12
  "MIXTH-M",     // Spicy Mixture Hot 300g x 20
];

async function fetchProductByCode(code: string): Promise<{ _id: string; name: string } | null> {
  return await client.fetch(
    `*[_type == "product" && code == $code][0] { _id, name }`,
    { code }
  );
}

async function uploadImage(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const filename = filePath.split("/").pop() || "image.png";
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function attachImageToProduct(productId: string, assetId: string): Promise<void> {
  await client
    .patch(productId)
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
}

async function clearProductImage(productId: string): Promise<void> {
  await client
    .patch(productId)
    .unset(["image"])
    .commit();
}

async function renameProduct(productId: string, newName: string): Promise<void> {
  await client
    .patch(productId)
    .set({ name: newName })
    .commit();
}

async function main() {
  console.log("=".repeat(60));
  console.log("EXECUTING SANITY PRODUCT IMAGES RECTIFICATION");
  console.log("=".repeat(60));

  // --- Step 1: Clear wrong images ---
  console.log("\n>>> Clearing wrong images for products without local matches...");
  for (const code of codesToClear) {
    const product = await fetchProductByCode(code);
    if (!product) {
      console.warn(`[WARNING] Product with code "${code}" not found in Sanity.`);
      continue;
    }
    console.log(`Clearing image for: ${product.name} (Code: ${code})`);
    try {
      await clearProductImage(product._id);
      console.log(`  Successfully cleared image.`);
    } catch (err: any) {
      console.error(`  [ERROR] Failed to clear image for code ${code}: ${err.message}`);
    }
  }

  // --- Step 2: Upload and map correct images ---
  console.log("\n>>> Uploading and mapping correct images...");
  
  // Cache to avoid uploading same image path multiple times (e.g. MSGOLDPOMP.jpeg used for both AQGOLDP and GOL)
  const uploadedAssets = new Map<string, string>();

  for (const item of imagesToMap) {
    if (!fs.existsSync(item.path)) {
      console.error(`[ERROR] Local image file does not exist: ${item.path}`);
      continue;
    }

    const product = await fetchProductByCode(item.code);
    if (!product) {
      console.warn(`[WARNING] Product with code "${item.code}" not found in Sanity.`);
      continue;
    }

    console.log(`Processing mapping for: ${product.name} (Code: ${item.code})`);
    try {
      // 1. Rename if needed (e.g. for GOL)
      if (item.newName) {
        console.log(`  Cleaning name from "${product.name}" to "${item.newName}"`);
        await renameProduct(product._id, item.newName);
      }

      // 2. Upload asset or use cached asset id
      let assetId = uploadedAssets.get(item.path);
      if (!assetId) {
        console.log(`  Uploading local image: ${item.path}`);
        assetId = await uploadImage(item.path);
        uploadedAssets.set(item.path, assetId);
        console.log(`  Asset uploaded successfully (ID: ${assetId})`);
      } else {
        console.log(`  Using cached asset ID: ${assetId}`);
      }

      // 3. Attach asset reference to product
      await attachImageToProduct(product._id, assetId);
      console.log(`  Successfully attached image to product.`);
    } catch (err: any) {
      console.error(`  [ERROR] Failed to update product ${item.code}: ${err.message}`);
    }
  }

  console.log("\nAll tasks completed successfully.");
}

main().catch(console.error);
