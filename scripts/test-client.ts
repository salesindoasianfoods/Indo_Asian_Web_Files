import { createClient } from "next-sanity";
const client = createClient({
  projectId: "test",
  dataset: "production",
  apiVersion: "2024-04-20",
  useCdn: false,
  fetchOptions: { cache: "no-store" },
} as any);
console.log("Client created OK");
