"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import NoImage from "../common/NoImage";

const brandLogo = "/icons/indo-asian-logo-main.png";
const cartIcon = "/icons/shopping-card-icon.png";
const quantityPlus = "/icons/plus-red-icon.png";
const quantityMinus = "/icons/minus-icon.png";
// Inline white SVG plus — used on the red CTA button so it’s visible
const addToCartPlusSvg = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' viewBox='0 0 24 24'%3E%3Cpath d='M12 5v14M5 12h14'/%3E%3C/svg%3E";
const cardPlusSvg = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' viewBox='0 0 24 24'%3E%3Cpath d='M12 5v14M5 12h14'/%3E%3C/svg%3E";
const searchIcon = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentcolor' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductDetailData = {
  _id: string;
  name: string;
  slug: string;
  code: string;
  unit?: string;
  weight?: string;
  price?: string;
  badge?: string;
  image?: string;
  categoryName?: string;
  categoryId?: string;
};

export type RelatedProduct = {
  _id: string;
  name: string;
  code: string;
  slug?: string;
  unit?: string;
  weight?: string;
  price?: string;
  image?: string;
};

// ─── Header ───────────────────────────────────────────────────────────────────

function HeaderSearch() {
  return (
    <label className="product-detail-header__search">
      <img alt="" src={searchIcon} />
      <input placeholder="Search" type="text" />
    </label>
  );
}

// ─── Related Product Card ─────────────────────────────────────────────────────

function RelatedProductCard({ product }: { product: RelatedProduct }) {
  const { addToCart } = useCart();
  const href = `/product/${product._id}`;
  return (
    <Link href={href} className="related-product-card-link">
      <article className="related-product-card">
        <div className="related-product-card__media">
          {product.image ? (
            <img alt={product.name} src={product.image} />
          ) : (
            <NoImage />
          )}
        </div>
        <div className="related-product-card__content">
          <div className="related-product-card__head">
            <h3>{product.name}</h3>
            <p>Product code : {product.code}</p>
          </div>
          <dl className="related-product-card__meta">
            <div><dt>Unit</dt><dd>{product.unit}</dd></div>
            <div><dt>Weight</dt><dd>{product.weight}</dd></div>
          </dl>
          <div className="related-product-card__footer">
            <p>{product.price}</p>
            <button type="button" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart({
                _id: product._id,
                name: product.name,
                price: product.price || "£ 0",
                image: product.image,
                code: product.code,
                weight: product.weight
              });
            }}>
              <span>Add to Cart</span>
              <img alt="" src={cardPlusSvg} />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Product Gallery ──────────────────────────────────────────────────────────

function ProductGallery({ mainImage, name }: { mainImage?: string; name: string }) {
  const [activeImage, setActiveImage] = useState<string | undefined>(mainImage);

  // Only show thumbs when a real image exists
  const thumbs = mainImage ? [{ id: "main", src: mainImage }] : [];

  return (
    <div className="product-gallery">
      <div className="product-gallery__stage">
        {activeImage ? (
          <img alt={name} src={activeImage} />
        ) : (
          <NoImage />
        )}
      </div>

      {thumbs.length > 0 && (
        <div className="product-gallery__thumbs">
          {thumbs.map((t) => (
            <button
              key={t.id}
              className={`product-gallery__thumb ${activeImage === t.src ? "is-active" : ""}`}
              type="button"
              onClick={() => setActiveImage(t.src)}
            >
              <img alt={name} src={t.src} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Summary ──────────────────────────────────────────────────────────

function ProductSummary({ product }: { product: ProductDetailData }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="product-summary">
      {product.badge && (
        <div className="product-summary__badges">
          <span className="product-summary__badge product-summary__badge--green">
            {product.badge}
          </span>
        </div>
      )}

      <h1>{product.name}</h1>
      {product.price && (
        <p className="product-summary__price">{product.price}</p>
      )}

      <div className="product-summary__actions">
        <div className="product-quantity">
          <button
            className="product-quantity__button product-quantity__button--minus"
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <img alt="Minus" src={quantityMinus} />
          </button>
          <span>{qty}</span>
          <button
            className="product-quantity__button product-quantity__button--plus"
            type="button"
            onClick={() => setQty((q) => q + 1)}
          >
            <img alt="Plus" src={quantityPlus} />
          </button>
        </div>

        <button
          className="product-summary__cta"
          type="button"
          onClick={() => {
            for (let i = 0; i < qty; i++) {
              addToCart({
                _id: product._id,
                name: product.name,
                price: product.price || "£ 0",
                image: product.image,
                code: product.code,
                weight: product.weight
              });
            }
            // Reset qty to 1 after adding
            setQty(1);
          }}
        >
          <span>Add to Cart</span>
          <img alt="" src={addToCartPlusSvg} />
        </button>
      </div>

      <div className="product-summary__info">
        <h2>Product Information</h2>
        <dl>
          {product.unit && (
            <div><dt>Unit</dt><dd>{product.unit}</dd></div>
          )}
          {product.weight && (
            <div><dt>Weight</dt><dd>{product.weight}</dd></div>
          )}
          {product.code && (
            <div><dt>Product Code</dt><dd>{product.code}</dd></div>
          )}
        </dl>
      </div>
    </div>
  );
}

// ─── ProductDetailScreen ──────────────────────────────────────────────────────

type ProductDetailScreenProps = {
  product: ProductDetailData;
  relatedProducts?: RelatedProduct[];
};

export function ProductDetailScreen({ product, relatedProducts = [] }: ProductDetailScreenProps) {
  const { totalItems } = useCart();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(product.categoryName ? [{ label: product.categoryName, href: "/" }] : []),
    { label: product.name, href: "#" },
  ];

  return (
    <section className="product-detail">
      {/* ── Header ── */}
      <header className="product-detail-header">
        <div className="product-detail-header__brand">
          <img alt="Indo Asian Foods logo" className="product-detail-header__logo" src={brandLogo} />
          <p>INDO ASIAN FOODS LTD</p>
        </div>
        <div className="product-detail-header__actions">
          <HeaderSearch />
          <Link href="/cart-page" className="product-detail-header__cart">
            <img alt="" src={cartIcon} />
            {totalItems > 0 && <span>{totalItems}</span>}
          </Link>
        </div>
      </header>

      {/* ── Breadcrumbs ── */}
      <div className="product-detail__breadcrumbs">
        {breadcrumbs.map((crumb, i) => (
          <Link key={i} href={crumb.href} className={i === breadcrumbs.length - 1 ? "is-current" : ""}>
            {crumb.label}
          </Link>
        ))}
      </div>

      {/* ── Hero section ── */}
      <section className="product-detail__hero">
        <ProductGallery mainImage={product.image} name={product.name} />
        <ProductSummary product={product} />
      </section>

      {/* ── Related products ── */}
      {relatedProducts.length > 0 && (
        <section className="product-detail__related">
          <h2>Related Products</h2>
          <div className="product-detail__related-grid">
            {relatedProducts.map((p) => (
              <RelatedProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
