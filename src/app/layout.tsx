import type { Metadata } from "next";
import "./globals.scss";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: {
    default: "Indo Asian Foods Ltd | Premium Indian Groceries & Spices",
    template: "%s | Indo Asian Foods Ltd",
  },
  description:
    "Shop authentic Indian groceries, fresh spices, Kerala taste products, rice, masalas, snacks and daily essentials at Indo Asian Foods Ltd — your trusted source for premium quality products.",
  keywords: [
    "Indo Asian Foods",
    "Indian groceries",
    "Kerala products",
    "spices",
    "masala",
    "rice",
    "Double Horse",
    "Eastern Masala",
    "online grocery",
  ],
  openGraph: {
    title: "Indo Asian Foods Ltd | Premium Indian Groceries & Spices",
    description:
      "Authentic Indian groceries, spices, Kerala taste products and daily essentials — delivered fresh to your door.",
    siteName: "Indo Asian Foods Ltd",
    locale: "en_IN",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icons/indo-asian-logo-main.png?v=5", type: "image/png" },
    ],
    apple: "/icons/indo-asian-logo-main.png?v=5",
    shortcut: "/icons/indo-asian-logo-main.png?v=5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
