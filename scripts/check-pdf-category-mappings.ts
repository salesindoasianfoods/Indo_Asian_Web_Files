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

async function main() {
  const codes = [
    "ASAVIALCU",
    "AMBAZH-M",
    "MCCOFFEE",
    "IGCLASBASMATI1",
    "KASHCHILLIBT",
    "GRB",
    "TBALBHUJ",
    "TATASALT1",
    "SFMOMSM75"
  ];
  
  const results = await client.fetch(
    `*[_type == "product" && code in $codes]{
      code, name, category->{_id, name}
    }`,
    { codes }
  );
  console.log(JSON.stringify(results, null, 2));
}
main().catch(console.error);
