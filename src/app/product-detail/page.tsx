import { redirect } from "next/navigation";

// The static /product-detail route is superseded by /product/[id]
export default function ProductDetailPage() {
  redirect("/");
}
