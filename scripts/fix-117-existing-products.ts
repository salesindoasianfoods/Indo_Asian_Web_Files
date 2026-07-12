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

const PLACEHOLDER_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";
const IMAGE_BASE_DIR = "product-files/new proudcts/PRODUCTS LIST";
const COMPRESSED_DIR = "output/compressed-117";

// Build file map of all images
const fileMap = new Map<string, string>();
function walkDir(dir: string) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(entry)) {
      if (!fileMap.has(entry)) {
        fileMap.set(entry, fullPath);
      }
    }
  }
}
walkDir(IMAGE_BASE_DIR);

// The 117 products from generate-new-products-pdf.py that matched Sanity by name
const PRODUCTS_117: { brand: string; name: string; img: string; sanityCode: string }[] = [
  { brand: "Aswas", name: "Aswas Sambar Mix", img: "ASAMMIX.jpeg", sanityCode: "ASSAMMIX" },
  { brand: "Aswas", name: "Aswas Chappathi", img: "ASCHAPPATHI.jpeg", sanityCode: "SHACHI-M" },
  { brand: "Aswas", name: "Aswas Cut Mango", img: "ASCUTMAN.jpeg", sanityCode: "SARMANGO" },
  { brand: "Aswas", name: "Aswas Ginger", img: "ASGING.jpeg", sanityCode: "ASLONGBE" },
  { brand: "Aswas", name: "Aswas Gooseberry", img: "ASGOOS.jpeg", sanityCode: "VSGOOSB-M" },
  { brand: "Aswas", name: "Aswas Idiyappam", img: "ASIDI.jpeg", sanityCode: "ASIDIYAW" },
  { brand: "Aswas", name: "Aswas Idiyappam (Brown)", img: "ASIDIYAB.jpeg", sanityCode: "ASIDIYAW" },
  { brand: "Aswas", name: "Aswas Jackfruit Green Sliced", img: "ASJACKGREESLI.jpeg", sanityCode: "VSJACFR" },
  { brand: "Aswas", name: "Aswas Jackfruit Seed", img: "ASJACKSEED.jpeg", sanityCode: "VSJACS" },
  { brand: "Aswas", name: "Aswas Jackfruit Whole", img: "ASJACKWHOLE.jpeg", sanityCode: "ASELAJACK350" },
  { brand: "Aswas", name: "Aswas Okra", img: "ASOKRA.jpeg", sanityCode: "ASBONDA350" },
  { brand: "Aswas", name: "Aswas Tapioca Sliced", img: "ASSLITAP.jpeg", sanityCode: "VSTAPSL5BS" },
  { brand: "Aswas", name: "Aswas Tapioca Whole", img: "ASTAP.jpeg", sanityCode: "VSTAPW-M" },
  { brand: "Aswas", name: "Aswas Wheat Porotta", img: "ASWHEAPORA.jpeg", sanityCode: "ASRESPAR2" },
  { brand: "Aswas", name: "Aswas Kozhukkatta", img: "aswas kozhukkatta.jpg", sanityCode: "ASKOZHU350" },
  { brand: "Malabar Choice", name: "Malabar Choice Banana Chips", img: "Copy of MALABAR 1.jpg", sanityCode: "MCBAN-M" },
  { brand: "Malabar Choice", name: "Malabar Choice Spicy Banana Chips", img: "Copy of MALABAR 2.jpg", sanityCode: "MCJBANC" },
  { brand: "Malabar Choice", name: "Malabar Choice Ripe Banana Chips", img: "Copy of MALABAR 4.jpg", sanityCode: "MCBANRIPLONG" },
  { brand: "Malabar Choice", name: "Malabar Choice Rice Murukku", img: "Copy of MALABAR 3.jpg", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Spicy Garlic Murukku", img: "Copy of MALABAR 6.jpg", sanityCode: "MCCHILLIGAR" },
  { brand: "Malabar Choice", name: "Malabar Choice Spicy Ring Murukku", img: "Copy of MALABAR 26.jpg", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Tomato Murukku", img: "Copy of MALABAR 27.jpg", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Kerala Mixture", img: "Copy of MALABAR 7.jpg", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice Spicy Kerala Mixture", img: "Copy of MALABAR 8.jpg", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice Gingelly Balls", img: "Copy of MALABAR 9.jpg", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice Roasted Rava", img: "Copy of MALABAR 10.jpg", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice Maida", img: "Copy of MALABAR 11.jpg", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice White Rice Flakes", img: "Copy of MALABAR 12.jpg", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Roasted Rice Flakes Brown", img: "Copy of MALABAR 13.jpg", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Roasted Vermicelli", img: "Copy of MALABAR 29.jpg", sanityCode: "MTRROSVE440" },
  { brand: "Malabar Choice", name: "Malabar Choice Wayanadan Kaima", img: "MC WAYANADAN KAIMA.webp", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice ATT5", img: "MCATT5.webp", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice Murukku Bottle", img: "MCMURMBOTT.webp", sanityCode: "MCMURU-MBOTT" },
  { brand: "Malabar Choice", name: "Malabar Choice Sugar Candy", img: "MCSUGARCANDY.avif", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice Fenugreek", img: "fenugreek.png", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Idly Rice 2kg", img: "idly rice 2 kg.png", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Jaya Rice 5kg", img: "jaya rice 5 kg.png", sanityCode: "MALA5" },
  { brand: "Malabar Choice", name: "Malabar Choice Garlic Paste", img: "mc garlic paste.png", sanityCode: "MCGARPAS" },
  { brand: "Malabar Choice", name: "Malabar Choice Garlic Pickle", img: "mc garlic pickle.png", sanityCode: "MCGAR" },
  { brand: "Malabar Choice", name: "Malabar Choice Khima Rice 5kg", img: "mc khima rice 5 kg.png", sanityCode: "MALA5" },
  { brand: "Malabar Choice", name: "Malabar Choice Maida (All Purpose Flour)", img: "mc maida.png", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Rock Sugar", img: "mc rock sugar.png", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Tamarind 200g", img: "mc tamarind 200g.png", sanityCode: "MCTAM" },
  { brand: "Malabar Choice", name: "Malabar Choice Vadukapuli Lime", img: "mc vadukapuli lime .png", sanityCode: "MCMAT" },
  { brand: "Malabar Choice", name: "Malabar Choice Vinegar 500ml", img: "vinegar 500 ml.png", sanityCode: "ESTCHIMAL" },
  { brand: "Malabar Choice", name: "Malabar Choice Indian Green Cardamom", img: "mc cardamon .png", sanityCode: "MCMAT" },
  { brand: "Haldiram", name: "Haldiram Boondi", img: "HDBOONDI.webp", sanityCode: "HDBOONDIPLAIN" },
  { brand: "Haldiram", name: "Foxnut Salt & Pepper", img: "HDFOXNUTSALTANDPEPPER.jpeg", sanityCode: "HDFOXNUTSALTPEPPER" },
  { brand: "Haldiram", name: "Gujarati Mix", img: "HDGUJARATIMIX.webp", sanityCode: "HDGUJRATIMIX" },
  { brand: "Haldiram", name: "Khari Methi", img: "HDKHARIMETHI.webp", sanityCode: "HDKHARIMEETHI" },
  { brand: "Haldiram", name: "Long Sev", img: "HDLONGSEV.jpg", sanityCode: "HDOLONGSEV" },
  { brand: "Haldiram", name: "Murukku", img: "HDMURUKKU.webp", sanityCode: "MUL-M" },
  { brand: "Haldiram", name: "Navaratna Mix", img: "HDNAVARATNA.webp", sanityCode: "HDNAVRATNA" },
  { brand: "Haldiram", name: "Nimbu Masala", img: "HDNIMBU MASALA.webp", sanityCode: "HDNIMBUMASALA" },
  { brand: "Haldiram", name: "Panchrattan", img: "HDPANCHRATTAN.webp", sanityCode: "APPAMC" },
  { brand: "Periyar", name: "Ada", img: "ADA-M.webp", sanityCode: "VSELAYJAG" },
  { brand: "Periyar", name: "Cumin", img: "CUM-M.avif", sanityCode: "VSCUM-M" },
  { brand: "Periyar", name: "Cumin 200g", img: "CUMI200.avif", sanityCode: "MCCUM" },
  { brand: "Periyar", name: "Desiccated Coconut", img: "DESICF1.jpg", sanityCode: "DESI-M" },
  { brand: "Periyar", name: "Desiccated Coconut 5kg", img: "DESICF5.jpg", sanityCode: "DESI-M" },
  { brand: "Periyar", name: "Desi Mix 500g", img: "DESIM500.webp", sanityCode: "MTRDOSAM500" },
  { brand: "Periyar", name: "Dry Shrimp", img: "DRYSHECH.avif", sanityCode: "DRYSW-M" },
  { brand: "Periyar", name: "Vermicelli", img: "VER-M.jpg", sanityCode: "MCVERMUN" },
  { brand: "Daily Delight", name: "Carrot", img: "CARROTP-M.webp", sanityCode: "VSDATCARCAK" },
  { brand: "Daily Delight", name: "Ceylon", img: "CEY-M.webp", sanityCode: "CEYP" },
  { brand: "Daily Delight", name: "Chinese Potato", img: "CHI332.webp", sanityCode: "SARCHI" },
  { brand: "Daily Delight", name: "Drumstick", img: "DRUM.jpg", sanityCode: "DRU-M" },
  { brand: "Daily Delight", name: "Jackfruit Green 224g", img: "JACKFRU224.webp", sanityCode: "JACG-M" },
  { brand: "Daily Delight", name: "Sweet", img: "SWE-N.webp", sanityCode: "MCBANRIPLON20" },
  { brand: "Eastern", name: "Black Chana", img: "ESTBLA eastern black chana.jpg", sanityCode: "KTCHANN-M" },
  { brand: "Eastern", name: "Fish Pickle", img: "ESTFI eastern fish pickle.jpg", sanityCode: "MTFISHPIC" },
  { brand: "Eastern", name: "Prawn Pickle", img: "ESTPR eastern prawn pickle.jpg", sanityCode: "TNPRAPICKLE" },
  { brand: "Eastern", name: "Chick Peas 1kg", img: "ESTCHC eastern chick peas 800gm.png", sanityCode: "KTCHIC-M" },
  { brand: "Eastern", name: "Cumin Seed 100g", img: "ESTCUM eastern cumin whole.jpg", sanityCode: "VSCUM-M" },
  { brand: "Double Horse", name: "Pat2", img: "DHPAT2-M.jpg", sanityCode: "PARH" },
  { brand: "Double Horse", name: "Puttu Odi 1kg", img: "DHPUTTUODI1W1KG.jpg", sanityCode: "DHPUB" },
  { brand: "Double Horse", name: "Unroasted Rice", img: "DHUNRIC.jpeg", sanityCode: "MTRROSVE440" },
  { brand: "Double Horse", name: "Vermicelli Long", img: "DHVERL-M.jpg", sanityCode: "MTRVER440" },
  { brand: "Double Horse", name: "Vinegar", img: "DHVINEGAR-M.png", sanityCode: "KTVINE" },
  { brand: "Marine Sea Fresh", name: "Japanese Mackerel 600g", img: "MSJAPANE600.jpeg", sanityCode: "HORM" },
  { brand: "Marine Sea Fresh", name: "Mackerel 600g", img: "MSMACKE600.jpeg", sanityCode: "MACW-M" },
  { brand: "Neptune Frozen Fresh", name: "King Fish 1.2kg", img: "NPKIN1.2.jpeg", sanityCode: "NPKING1-M" },
  { brand: "Neptune Frozen Fresh", name: "Squid", img: "NPSQRI.jpeg", sanityCode: "AQSQUDR" },
  { brand: "Frozen Breakfast & Porotta", name: "Poori Masala", img: "Poori Masala.jpg", sanityCode: "ESTTA" },
  { brand: "Frozen Breakfast & Porotta", name: "Veg Stew", img: "Veg Stew.jpg", sanityCode: "VSPALVSTEW" },
  { brand: "Frozen Breakfast & Porotta", name: "Wheat Puttu with Kadala Curry", img: "Wheat Puttu With Kadala Currry.jpeg", sanityCode: "VSPUTKADW" },
  { brand: "Frozen Breakfast & Porotta", name: "Idiyappam Brown", img: "idiyappam brown.jpeg", sanityCode: "IDIB-M" },
  { brand: "Frozen Curries", name: "Madura Curry", img: "Madura Curry.jpg", sanityCode: "VSSAMBAR" },
  { brand: "Frozen Vegetables", name: "Bilimbi", img: "Bilimbi.jpeg", sanityCode: "ESTBIL" },
  { brand: "Frozen Vegetables", name: "Viswas Okra Whole 400g", img: "Okra Whole.jpeg", sanityCode: "SHAOKR-M" },
  { brand: "Frozen Vegetables", name: "Yam Ratalu", img: "Yam Ratalu.jpeg", sanityCode: "YAMRATALU" },
  { brand: "Viswas Frozen Snacks", name: "Elayada Sugar", img: "Elayada Sugar.jpg", sanityCode: "ELAJA-M" },
  { brand: "Viswas Frozen Snacks", name: "Elayada Sugar (alt)", img: "Elayada sugar.jpeg", sanityCode: "TATA" },
  { brand: "Viswas Frozen Snacks", name: "Chakka Varatti", img: "chakka varatti.png", sanityCode: "VSCHAKAV" },
  { brand: "Pickles", name: "Coconut Chutney Powder", img: "Coconut Cutney Powder.jpeg", sanityCode: "ESTCOCHU" },
  { brand: "Pickles", name: "Idly Chutney Podi", img: "IDLY CHUTNEY PODI.jpeg", sanityCode: "MCIDCHUPO" },
  { brand: "Pickles", name: "Kandari Chilli Mango", img: "Kandari Chilli Mango.jpeg", sanityCode: "VSKAN" },
  { brand: "Pickles", name: "Kanthari in Brine", img: "Kanthari in Brine.jpeg", sanityCode: "KTKANDARI" },
  { brand: "Bottle Snacks", name: "Jalepeno Chakkri Bottle", img: "jalepeno chakkri bottle.png", sanityCode: "ESTCHU" },
  { brand: "Bottle Snacks", name: "Sharkkaravaratty Bottle", img: "sharkkaravaratty bottle.png", sanityCode: "MCSHARB" },
  { brand: "Bottle Snacks", name: "White Mix Bottle", img: "white mix bottle.png", sanityCode: "ESTCHU" },
  { brand: "Whole Spices & Others", name: "Chilly Whole", img: "Chilly Whole.jpeg", sanityCode: "DHCHILLI1" },
  { brand: "Whole Spices & Others", name: "Star Anise", img: "Star anise.jpeg", sanityCode: "MLSTARANI" },
  { brand: "Whole Spices & Others", name: "Cardamom Whole", img: "cardamom whole.jpeg", sanityCode: "MCCARDOM" },
  { brand: "Whole Spices & Others", name: "Fenugreek", img: "fenugreek.jpeg", sanityCode: "ESTFENUGREEK" },
  { brand: "Whole Spices & Others", name: "Matta Rice 10kg", img: "matta 10kg.jpg", sanityCode: "KTMAT-M" },
  { brand: "Whole Spices & Others", name: "Viswas Whole Coriander Seeds", img: "Whole Coriander.jpeg", sanityCode: "SARCORI" },
  { brand: "Melam", name: "Instant Palappam", img: "MELINSTPAL-M.webp", sanityCode: "VSPALAP908" },
  { brand: "Melam", name: "White Mix", img: "MLWHI-M.webp", sanityCode: "KTWHITRI" },
  { brand: "SHANA", name: "Chilli & Garlic", img: "SHACHIANDGAR-M.jpg", sanityCode: "MCCHILLIGAR" },
  { brand: "SHANA", name: "Shana Product", img: "SHAP.png", sanityCode: "SHALA-M" },
  { brand: "GRB", name: "Pineapple Halwa", img: "GEBPINEHAL.jpg", sanityCode: "PINEAPHAL" },
  { brand: "India Gate", name: "Basmati Rice 5kg", img: "IGBASMATU5.webp", sanityCode: "IGBASMATI5" },
  { brand: "Crispy", name: "Crispy Snack", img: "CRRITEARUR.jpg", sanityCode: "CRINIMISHP" },
  { brand: "Tasty Nibbles", name: "Chilli Powder", img: "TNKCCHILPO.jpeg", sanityCode: "ESTKAS" },
  { brand: "Dry Snacks", name: "Achappam", img: "Achappam.jpg", sanityCode: "MCAC" },
  { brand: "Family Pack", name: "Kumbilappam Family Pack", img: "kumbilappam family pack.png", sanityCode: "VSKUMBILFA" },
];

async function fetchProduct(code: string) {
  return client.fetch<{ _id: string; name: string; image?: any } | null>(
    `*[_type == "product" && code == $code][0] { _id, name, image }`,
    { code }
  );
}

async function uploadImage(filePath: string, filename: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function attachImage(productId: string, assetId: string) {
  await client.patch(productId).set({
    image: { _type: "image", asset: { _type: "reference", _ref: assetId } },
  }).commit();
}

function compressImage(inputPath: string, outputPath: string): boolean {
  try {
    const stats = fs.statSync(inputPath);
    const sizeKb = stats.size / 1024;
    const ext = path.extname(inputPath).toLowerCase();

    // If already small (< 80KB), just convert to jpg without aggressive recompression
    const quality = sizeKb < 80 ? "2" : "5";

    // For PNG with transparency, add white background
    const vf = ext === ".png"
      ? "scale='min(1200,iw)':-1,format=rgba,geq=r='p(X,Y)':a='255'"
      : "scale='min(1200,iw)':-1";

    execSync(
      `ffmpeg -y -hide_banner -loglevel error -i "${inputPath}" -vf "${vf}" -q:v ${quality} "${outputPath}"`,
      { timeout: 30000 }
    );
    return fs.existsSync(outputPath);
  } catch (e) {
    console.error(`Compression failed for ${inputPath}:`, e);
    return false;
  }
}

async function main() {
  fs.mkdirSync(COMPRESSED_DIR, { recursive: true });

  console.log("=".repeat(80));
  console.log("FIX 117 EXISTING PRODUCTS — IMAGE UPLOAD");
  console.log("=".repeat(80));

  const results: any[] = [];
  let success = 0;
  let skippedHasImage = 0;
  let noFile = 0;
  let compressFail = 0;
  let uploadFail = 0;
  let patchFail = 0;
  let productNotFound = 0;

  const uploadedAssets = new Map<string, string>();

  for (let i = 0; i < PRODUCTS_117.length; i++) {
    const item = PRODUCTS_117[i];
    const progress = `[${String(i + 1).padStart(3)}/${PRODUCTS_117.length}]`;
    process.stdout.write(`\r${progress} ${item.sanityCode.padEnd(12)} ${item.name.slice(0, 35).padEnd(37)}`);

    if (i > 0 && i % 30 === 0) {
      process.stdout.write("  (pausing)...");
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 1. Find source image
    const srcPath = fileMap.get(item.img);
    if (!srcPath || !fs.existsSync(srcPath)) {
      noFile++;
      results.push({ ...item, status: "no-file" });
      continue;
    }

    // 2. Fetch product
    const product = await fetchProduct(item.sanityCode);
    if (!product) {
      productNotFound++;
      results.push({ ...item, status: "product-not-found" });
      continue;
    }

    // 3. Skip if already has real image
    const assetRef = product.image?.asset?._ref;
    if (assetRef && assetRef !== PLACEHOLDER_REF) {
      skippedHasImage++;
      results.push({ ...item, status: "skipped-has-image", productId: product._id });
      continue;
    }

    // 4. Compress image
    const baseName = path.basename(item.img, path.extname(item.img));
    const compressedPath = path.join(COMPRESSED_DIR, `${baseName}.jpg`);
    const compressed = compressImage(srcPath, compressedPath);
    if (!compressed || !fs.existsSync(compressedPath)) {
      compressFail++;
      results.push({ ...item, status: "compress-failed", productId: product._id });
      continue;
    }

    // 5. Upload (or reuse)
    let assetId: string;
    const cacheKey = item.img;
    if (uploadedAssets.has(cacheKey)) {
      assetId = uploadedAssets.get(cacheKey)!;
    } else {
      try {
        assetId = await uploadImage(compressedPath, `${baseName}.jpg`);
        uploadedAssets.set(cacheKey, assetId);
      } catch (err: any) {
        uploadFail++;
        results.push({ ...item, status: "upload-failed", productId: product._id, error: err.message });
        continue;
      }
    }

    // 6. Patch product
    try {
      await attachImage(product._id, assetId);
      success++;
      results.push({ ...item, status: "success", productId: product._id, assetId });
    } catch (err: any) {
      patchFail++;
      results.push({ ...item, status: "patch-failed", productId: product._id, assetId, error: err.message });
    }
  }

  process.stdout.write("\n");

  console.log("\n" + "=".repeat(80));
  console.log("RESULTS");
  console.log("=".repeat(80));
  console.log(`Success:            ${success}`);
  console.log(`Skipped (has img):  ${skippedHasImage}`);
  console.log(`No source file:     ${noFile}`);
  console.log(`Compress failed:    ${compressFail}`);
  console.log(`Upload failed:      ${uploadFail}`);
  console.log(`Patch failed:       ${patchFail}`);
  console.log(`Product not found:  ${productNotFound}`);
  console.log(`Total:              ${PRODUCTS_117.length}`);
  console.log(`Unique uploads:     ${uploadedAssets.size}`);

  const reportPath = `output/fix-117-report-${Date.now()}.json`;
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ timestamp: new Date().toISOString(), summary: { success, skippedHasImage, noFile, compressFail, uploadFail, patchFail, productNotFound, total: PRODUCTS_117.length }, results }, null, 2)
  );
  console.log(`\nReport: ${reportPath}`);
}

main().catch(console.error);
