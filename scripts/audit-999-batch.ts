import fs from "fs";
import path from "path";
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

const IMAGE_BASE_DIR = "product-files/new proudcts/PRODUCTS LIST";

function normalizeBase(name: string) {
  return path.basename(name, path.extname(name)).toLowerCase().trim();
}

async function main() {
  console.log("Auditing 999 Image Batch (Deep Detail)...");

  const fileList: { name: string; path: string }[] = [];
  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(entry.name)) {
        fileList.push({ name: entry.name, path: fullPath });
      }
    }
  }
  walkDir(IMAGE_BASE_DIR);
  
  const uniqueFiles = new Map<string, string>();
  for (const f of fileList) {
    const base = normalizeBase(f.name);
    if (!uniqueFiles.has(base)) {
      uniqueFiles.set(base, f.name);
    }
  }

  console.log("Fetching all product mappings from Sanity...");
  const products = await client.fetch<any[]>(
    `*[_type == "product" && defined(image.asset)] { _id, name, code, "assetName": image.asset->originalFilename }`
  );

  const sanityMap = new Map<string, any>();
  for (const p of products) {
    if (p.assetName) {
      sanityMap.set(normalizeBase(p.assetName), p);
    }
  }

  const attached: any[] = [];
  const notAttached: any[] = [];

  for (const [base, originalName] of uniqueFiles) {
    if (sanityMap.has(base)) {
      const p = sanityMap.get(base);
      attached.push({
        filename: originalName,
        productName: p.name,
        productCode: p.code,
        status: "✅ LIVE"
      });
    } else {
      notAttached.push({
        filename: originalName,
        status: "❌ PENDING"
      });
    }
  }

  const results = {
    total: uniqueFiles.size,
    attachedCount: attached.length,
    pendingCount: notAttached.length,
    attached,
    pending: notAttached
  };

  fs.mkdirSync("output", { recursive: true });
  fs.writeFileSync("output/final-audit-999.json", JSON.stringify(results, null, 2));
  console.log(`\nAudit Complete: ${results.attachedCount} Attached, ${results.pendingCount} Pending.`);
}

main().catch(console.error);
