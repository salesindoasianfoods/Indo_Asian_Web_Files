import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { newArrivalsQuery } from "@/sanity/lib/catalog";
import Link from "next/link";
import "./new-arrivals.scss";

export const revalidate = 60;

export default async function NewArrivalsPage() {
  let images: { id: string; image: string }[] = [];

  try {
    const data = await client.fetch(newArrivalsQuery);
    if (data && Array.isArray(data) && data.length > 0) {
      images = data;
    }
  } catch (error) {
    console.error("Failed to fetch new arrivals from Sanity:", error);
  }

  if (images.length === 0) {
    redirect("/");
  }

  return (
    <div className="new-arrivals-page">
      <header className="new-arrivals-header">
        <div className="container">
          <Link href="/" className="back-link">
            ← Back to Shop
          </Link>
          <h1>New Arrivals</h1>
        </div>
      </header>
      <main className="new-arrivals-content container">
        {images.map((img) => (
          <img key={img.id} src={img.image} alt="New Arrival Banner" className="new-arrivals-banner" />
        ))}
      </main>
    </div>
  );
}
