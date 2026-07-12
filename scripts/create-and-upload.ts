import { createClient } from "@sanity/client";
import * as fs from "fs";
import * as path from "path";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  apiVersion: "2023-05-03",
  useCdn: false,
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
});

const newProducts = [
    { imageFile: "ADA PRADHAMAN 500g", name: "VS ADA PRADHAMAN 500 X 12", price: "37.08" },
    { imageFile: "ANGAMALY MANGO CURRY 350g", name: "VIS ANGAMALI MANGO CURRY 350 X 12", price: "23.88" },
    { imageFile: "AVIYAL 400g", name: "VIS AVIYAL MIX 400G X12", price: "23.88" },
    { imageFile: "BANANA ROAST 350g", name: "VIS BANANA ROAST 454G X12", price: "34.99" },
    { imageFile: "BILIMBI 400g", name: "EST BILIMBI PICKLE 400G X12", price: "23.88" },
    { imageFile: "Black Halwa", name: "VIS HALWA BLACK 400G X 14", price: "33.46" },
    { imageFile: "BOLI 350g", name: "VS BOLI 350 X 12", price: "35.88" },
    { imageFile: "BONDA 350g", name: "VIS BONDA350GX12", price: "23.99" },
    { imageFile: "BREADFRUIT 400g", name: "VIS BREADFRUIT (NOT COOKED) 400 X 12", price: "25.99" },
    { imageFile: "CHAKKAKURU MANGA CURRY 350g", name: "VIS CHAKKAKURU MANGO CURRY 350G X 12", price: "23.88" },
    { imageFile: "CHEERA THORAN 350g", name: "VIS CHEERATHORAN 350 X 12", price: "22.69" },
    { imageFile: "CHEMBA PUTTU AND KADALA 454g", name: "VIS CHEMBA PUTTU N KADALA  454 X 10", price: "21.90" },
    { imageFile: "COCONUT BUN 350g", name: "VIS COCONUT BUN 350 X 12", price: "32.28" },
    { imageFile: "GREEN CHILLI 400g", name: "DD GREEN CHILLI KANTHARI 400G X9", price: "23.88" },
    { imageFile: "GURUVAYOOR PAPPADAM 200g", name: "MAYIL GURUVAYOOR PAPPADAM 200G X 40", price: "51.60" },
    { imageFile: "IDICHAKKA THORAN 400g", name: "VIS IDICHAKKATHORAN 350 X12", price: "22.69" },
    { imageFile: "IDIYAPPAM BROWN 454g", name: "VS IDIYAPPAM PODI BROWN 1KG X12 *PRICE MARK*", price: "17.88" },
    { imageFile: "IDIYAPPAM WHITE 400g", name: "VIS IDIYAPPAM WHITE 454G X12", price: "23.88" },
    { imageFile: "IDLI FAMILY 908g", name: "DD REST IDLI FAMILY PACK 12 X 1.2KG", price: "38.99" },
    { imageFile: "JACKFRUIT SLICED 400g", name: "VIS JACKFRUIT GREEN SLICED 400G X20", price: "54.99" },
    { imageFile: "JILEBI 350g", name: "VIS JILEBI 227G X12 @", price: "1.99" },
    { imageFile: "KERALA MIRTURE", name: "VS KERALA MIXTURE 200G X25", price: "24.99" },
    { imageFile: "KOZHUKKATTA 350g", name: "VIS KOZHUKKATTA  350G X12", price: "23.88" },
    { imageFile: "KUMBILAPPAM FAMILY 908g", name: "VIS KUMBILAPPAM JACKFRUIT FAMILY 908 X 12", price: "56.28" },
    { imageFile: "MASALA DOSA 400g", name: "VIS MASALA DOSA 400 X 12", price: "23.88" },
    { imageFile: "OKRA WHOLE 400g", name: "VIS OKRA CUT 400G X12", price: "17.99" },
    { imageFile: "PALAPPAM 350g", name: "VIS PALAPPAM FAMILY 908GM X  8", price: "27.99" },
    { imageFile: "PATHIRI 400g", name: "VIS PATHIRI 300 X 14", price: "26.99" },
    { imageFile: "PICKLE POWDER 160g", name: "VS PICKLE  POWDER 160G X12", price: "16.68" },
    { imageFile: "Red Halwa", name: "VIS HALWA RED 400G X 14", price: "33.46" },
    { imageFile: "RIPE BANANA BOTTLE", name: "MC BANANA CHIPS RIPE BOTTLE 250G X15", price: "38.85" },
    { imageFile: "SAMBAR CURRY 400g", name: "VIS SAMBAR CURRY 454 X 12", price: "23.88" },
    { imageFile: "SNAKE GOURD 400g", name: "DD SNAKE GOURD 400G X12", price: "22.68" },
    { imageFile: "SPICY BANANA BOTTLE", name: "VS BANANA CHIPS BOTTLE 300X15", price: "34.35" },
    { imageFile: "STEAMED BANANA 400g", name: "VIS BANANA STEAMED 500 X 12", price: "27.00" },
    { imageFile: "TAPIOCA ROUND PLAIN", name: "VS TAPIOCA CHIPS ROUND PLAIN BTL 150G X15", price: "19.99" },
    { imageFile: "TAPIOCA ROUND SPICY", name: "VS TAPIOCA CHIPS ROUND SPICY 200G X20", price: "27.80" },
    { imageFile: "TAPIOCA WITH CHUTNEY 350g", name: "VIS TAPIOCA WITH CHUTNEY454GX 12", price: "21.48" },
    { imageFile: "VEG CUTLET FAMILY 908g", name: "VIS CUTLET VEG FAMILY 908G X 12", price: "63.99" },
    { imageFile: "VEGETABLE BIRIYANI 400g", name: "DD VEGETABLE BIRIYANI 282G X12", price: "23.99" },
    { imageFile: "VEGETABLE SAMOSA 350g", name: "VIS VEGETABLE SAMOSA 300GX 12", price: "23.99" },
    { imageFile: "WHITE MIXTURE", name: "VS MIXTURE WHITE 200GM X 25", price: "19.75" }
];

function findFileRecursively(dir: string, filenamePattern: string): string | null {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            const found = findFileRecursively(p, filenamePattern);
            if (found) return found;
        } else if (f.toLowerCase().includes(filenamePattern.toLowerCase())) {
            return p;
        }
    }
    return null;
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

async function main() {
    // 1. Fetch the category ID for "Viswas snacks" (or similar)
    const category = await client.fetch(`*[_type == "category" && name match "Viswas*"][0]`);
    let categoryRef = category ? { _type: 'reference', _ref: category._id } : null;
    
    if (!categoryRef) {
        console.log("Could not find Viswas category. Will try fetching all categories...");
        const allCategories = await client.fetch(`*[_type == "category"]`);
        const viswasCat = allCategories.find((c: any) => c.name && c.name.toLowerCase().includes("viswas"));
        if (viswasCat) {
             categoryRef = { _type: 'reference', _ref: viswasCat._id };
        } else {
             console.log("Still no Viswas category. Creating one...");
             const newCat = await client.create({
                 _type: 'category',
                 name: 'Viswas Frozen Snacks',
                 slug: { _type: 'slug', current: 'viswas-frozen-snacks' }
             });
             categoryRef = { _type: 'reference', _ref: newCat._id };
        }
    }
    
    console.log(`Using Category: ${categoryRef._ref}`);
    
    let successCount = 0;
    
    for (const item of newProducts) {
        console.log(`\\nProcessing ${item.name}...`);
        
        // Find image locally
        const imagePath = findFileRecursively(path.join(process.cwd(), "products-ref"), item.imageFile);
        if (!imagePath) {
            console.log(`❌ Local image not found for ${item.imageFile}`);
            continue;
        }
        
        // Check if product already exists
        const existingProduct = await client.fetch(`*[_type == "product" && name == $name][0]`, { name: item.name });
        
        let productId;
        
        if (existingProduct) {
            console.log(`Product already exists in Sanity. ID: ${existingProduct._id}`);
            productId = existingProduct._id;
        } else {
            console.log(`Creating new product...`);
            // Create product document
            const productDoc = {
                _type: 'product',
                name: item.name,
                slug: {
                    _type: 'slug',
                    current: slugify(item.name)
                },
                price: parseFloat(item.price),
                category: categoryRef
            };
            
            const created = await client.create(productDoc);
            productId = created._id;
            console.log(`✅ Created product ${productId}`);
        }
        
        console.log(`Uploading image from ${imagePath}...`);
        const imageAsset = await client.assets.upload('image', fs.createReadStream(imagePath), {
            filename: path.basename(imagePath)
        });
        
        console.log(`Linking image to product...`);
        await client.patch(productId)
            .set({
                image: {
                    _type: 'image',
                    asset: {
                        _type: "reference",
                        _ref: imageAsset._id
                    }
                }
            })
            .commit();
            
        console.log(`✅ Fully processed ${item.name}!`);
        successCount++;
    }
    
    console.log(`\\n🎉 All done! Successfully created/patched ${successCount} new products!`);
}

main().catch(console.error);
