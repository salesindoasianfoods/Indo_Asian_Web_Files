import { createClient } from "@sanity/client";
import * as fs from "fs";
import * as path from "path";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lz2bjis5",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  const scriptsToRead = [
    "move-aswas.ts",
    "move-finally-candy.ts",
    "move-peanut-candy.ts",
    "move-two-products.ts",
    "move-three-products.ts",
    "move-12-dd-products.ts",
    "move-barracuda.ts",
    "delete-crocker.ts",
    "move-mango-jam.ts",
    "move-trevally-and-jam.ts",
    "move-jalebi.ts",
    "move-meenpeera.ts",
    "move-vadukapuli.ts",
    "remove-three-images.ts",
    "remove-two-images-part2.ts",
    "remove-two-images-part3.ts",
    "p1.ts", "p2.ts", "p3.ts", "p4.ts", "p5.ts"
  ];

  const allIds = new Set<string>();

  for (const scriptName of scriptsToRead) {
    const fullPath = path.join(process.cwd(), "scripts", scriptName);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf-8");
    
    const patchMatches = [...content.matchAll(/patch\(['"]([^'"]+)['"]\)/g)];
    for (const match of patchMatches) {
      allIds.add(match[1]);
    }
  }

  const extraScripts = ["remove-two-images.ts", "remove-shana-image.ts", "check-categories-for-two.ts", "find-misplaced-dd.ts", "find-misplaced-dd-broad.ts", "verify-ladoo-fish.ts"];
  for (const scriptName of extraScripts) {
    const fullPath = path.join(process.cwd(), "scripts", scriptName);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf-8");
    const patchMatches = [...content.matchAll(/patch\(['"]([^'"]+)['"]\)/g)];
    for (const match of patchMatches) {
      allIds.add(match[1]);
    }
  }

  const ids = Array.from(allIds);
  console.log(`Found ${ids.length} unique IDs patched.`);
  
  const products = await client.fetch(`*[_id in $ids]{ _id, name, code, "categoryName": category->name }`, { ids });
  
  for (const p of products) {
    console.log(`- ${p.name} (Code: ${p.code}) | Cat: ${p.categoryName}`);
  }
}

main().catch(console.error);
