import fs from "fs";
import path from "path";
import sharp from "sharp";

const INPUT_DIR = "product-files/viswas products ";
const OUTPUT_DIR = "product-files/viswas-products-compressed";
const MAX_DIMENSION = 1200;

interface ImageReport {
  filename: string;
  originalSize: number;
  originalSizeFormatted: string;
  newSize: number;
  newSizeFormatted: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  format: string;
  reduction: number;
  reductionPercent: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function processImages() {
  const files = fs
    .readdirSync(INPUT_DIR)
    .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .sort();

  console.log(`Found ${files.length} images to process\n`);

  const reports: ImageReport[] = [];
  let totalOriginal = 0;
  let totalNew = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const inputPath = path.join(INPUT_DIR, filename);
    const outputPath = path.join(OUTPUT_DIR, filename);

    try {
      const originalStat = fs.statSync(inputPath);
      const originalSize = originalStat.size;

      const metadata = await sharp(inputPath).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;
      const format = metadata.format || "unknown";

      let pipeline = sharp(inputPath);

      // Resize if either dimension exceeds MAX_DIMENSION
      if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
        pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Compress based on format
      const ext = path.extname(filename).toLowerCase();
      if (ext === ".png") {
        pipeline = pipeline.png({ compressionLevel: 9, quality: 80 });
      } else if (ext === ".webp") {
        pipeline = pipeline.webp({ quality: 80 });
      } else {
        // jpg, jpeg, and fallback
        pipeline = pipeline.jpeg({ quality: 80, progressive: true, mozjpeg: true });
      }

      await pipeline.toFile(outputPath);

      const newStat = fs.statSync(outputPath);
      const newSize = newStat.size;

      const newMetadata = await sharp(outputPath).metadata();
      const newWidth = newMetadata.width || 0;
      const newHeight = newMetadata.height || 0;

      const reduction = originalSize - newSize;
      const reductionPercent = ((reduction / originalSize) * 100).toFixed(1);

      reports.push({
        filename,
        originalSize,
        originalSizeFormatted: formatBytes(originalSize),
        newSize,
        newSizeFormatted: formatBytes(newSize),
        originalWidth,
        originalHeight,
        newWidth,
        newHeight,
        format,
        reduction,
        reductionPercent,
      });

      totalOriginal += originalSize;
      totalNew += newSize;

      process.stdout.write(`\r[${i + 1}/${files.length}] ${filename}`);
    } catch (err: any) {
      console.error(`\n✗ Failed: ${filename} — ${err.message}`);
    }
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("COMPRESSION REPORT");
  console.log("=".repeat(80));

  console.log(
    `\n${"Filename".padEnd(45)} ${"Original".padStart(12)} ${"Compressed".padStart(12)} ${"Saved".padStart(10)} ${"%".padStart(6)} ${"Dimensions".padStart(15)}`
  );
  console.log("-".repeat(110));

  for (const r of reports) {
    const dim = `${r.originalWidth}x${r.originalHeight}`;
    const dimStr = r.originalWidth !== r.newWidth || r.originalHeight !== r.newHeight
      ? `${dim} → ${r.newWidth}x${r.newHeight}`
      : dim;
    console.log(
      `${r.filename.slice(0, 44).padEnd(45)} ${r.originalSizeFormatted.padStart(12)} ${r.newSizeFormatted.padStart(12)} ${formatBytes(r.reduction).padStart(10)} ${r.reductionPercent.padStart(6)} ${dimStr.padStart(15)}`
    );
  }

  console.log("-".repeat(110));
  const totalReduction = totalOriginal - totalNew;
  const totalReductionPercent = ((totalReduction / totalOriginal) * 100).toFixed(1);

  console.log(`\nTOTALS:`);
  console.log(`  Original size:   ${formatBytes(totalOriginal)}`);
  console.log(`  Compressed size: ${formatBytes(totalNew)}`);
  console.log(`  Bytes saved:     ${formatBytes(totalReduction)}`);
  console.log(`  Reduction:       ${totalReductionPercent}%`);
  console.log(`  Files processed: ${reports.length}`);
  console.log("=".repeat(80));
}

processImages().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
