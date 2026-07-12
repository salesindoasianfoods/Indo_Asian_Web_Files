import fs from "fs";
import path from "path";
import { execSync } from "child_process";
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

const MATCHES_FILE = "output/potential-matches-138.json";
const IMAGE_BASE_DIR = "product-files/new proudcts/PRODUCTS LIST";
const COMPRESSED_DIR = "output/compressed-deep-match";

// Build recursive file map
const fileMap = new Map<string, string>();
function walkDir(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(entry.name)) {
      if (!fileMap.has(entry.name.toLowerCase())) {
        fileMap.set(entry.name.toLowerCase(), fullPath);
      }
    }
  }
}

async function uploadImage(filePath: string, filename: string) {
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function attachImage(productId: string, assetId: string) {
  await client.patch(productId).set({
    image: { _type: "image", asset: { _type: "reference", _ref: assetId } }
  }).commit();
}

function compress(inputPath: string, outputPath: string): boolean {
  try {
    const stats = fs.statSync(inputPath);
    const quality = stats.size / 1024 < 80 ? "2" : "5";
    const ext = path.extname(inputPath).toLowerCase();
    const vf = ext === ".png" ? "scale='min(1200,iw)':-1,format=rgba,geq=r='p(X,Y)':a='255'" : "scale='min(1200,iw)':-1";
    execSync(`ffmpeg -y -hide_banner -loglevel error -i "${inputPath}" -vf "${vf}" -q:v ${quality} "${outputPath}"`, { timeout: 30000 });
    return fs.existsSync(outputPath);
  } catch { return false; }
}

async function main() {
  fs.mkdirSync(COMPRESSED_DIR, { recursive: true });
  walkDir(IMAGE_BASE_DIR);

  const matches = JSON.parse(fs.readFileSync(MATCHES_FILE, "utf-8"));
  console.log(`Starting upload for ${matches.length} deep-matched images...`);

  let success = 0, fail = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    console.log(`[${i + 1}/${matches.length}] Processing ${m.filename} -> ${m.productName}`);

    const srcPath = fileMap.get(m.filename.toLowerCase());
    if (!srcPath) {
      console.error(`  ❌ Image file not found: ${m.filename}`);
      fail++;
      continue;
    }

    const baseName = path.basename(m.filename, path.extname(m.filename));
    const outPath = path.join(COMPRESSED_DIR, `${baseName}.jpg`);

    if (!compress(srcPath, outPath)) {
      console.error(`  ❌ Compression failed: ${m.filename}`);
      fail++;
      continue;
    }

    try {
      const assetId = await uploadImage(outPath, `${baseName}.jpg`);
      await attachImage(m.productId, assetId);
      console.log(`  ✅ Success: Attached to ${m.productCode}`);
      success++;
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
      fail++;
    }
    
    // Pause for rate limit
    if (i > 0 && i % 10 === 0) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nUpload complete. Success: ${success}, Failed: ${fail}`);
}

main().catch(console.error);
