"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { type CatalogMetadata } from "@/sanity/lib/catalog";
import NoImage from "../common/NoImage";

const brandLogo = "/icons/indo-asian-logo-main.png";
const cartIcon = "/icons/shopping-card-icon.png";
const plusIcon = "/icons/plus-red-icon.png";
const searchIcon = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentcolor' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E";
const filterIcon = "/icons/filter-icon.png";
const dropdownIcon = "/icons/down-arrow-icon.png";
const gridIcon = "/icons/grid-view-icon.png";
const listIcon = "/icons/list-view-icon.png";
const cartDeleteIcon = "/icons/dustbin-icon.png";
const cartProceedIcon = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentcolor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='m9 18 6-6-6-6'/%3E%3C/svg%3E";
const listQtyPlusIcon = "/icons/plus-red-icon.png";
const listQtyMinusIcon = "/icons/minus-icon.png";

// ─── Types ───────────────────────────────────────────────────────────────────

export type HeroSlide = {
  id: string;
  image: string;
  alt: string;
};

export type SanityCategory = {
  _id: string;
  name: string;
  order: number;
  count?: number;
};

export type SanityProduct = {
  _id: string;
  name: string;
  code: string;
  slug?: string;
  unit?: string;
  weight?: string;
  price?: string;
  badge?: string;
  outOfStock?: boolean;
  image?: string;
  categoryId?: string;
};

export type ActiveFilters = {
  weight: Set<string>;
  tag: Set<string>;
  unit: Set<string>;
};

type ProductsApiResponse = {
  products: SanityProduct[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
  error?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchesQuery(product: SanityProduct, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    (product.name?.toLowerCase().includes(q) ?? false) ||
    (product.code?.toLowerCase().includes(q) ?? false) ||
    (product.unit?.toLowerCase().includes(q) ?? false) ||
    (product.weight?.toLowerCase().includes(q) ?? false)
  );
}

/** Parse a price string like "£ 300.00" → 300.00. Returns null if unparseable. */
function parsePrice(priceStr?: string): number | null {
  if (!priceStr) return null;
  const num = parseFloat(priceStr.replace(/[^\d.]/g, ""));
  return isNaN(num) ? null : num;
}

function getUniqueValues(products: SanityProduct[], key: keyof SanityProduct): string[] {
  const vals = new Set<string>();
  for (const p of products) {
    const v = p[key];
    if (typeof v === "string" && v.trim()) vals.add(v.trim());
  }
  return Array.from(vals).sort();
}

// ─── useClickOutside ─────────────────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// ─── FilterPill – checkbox dropdown ──────────────────────────────────────────

type FilterPillProps = {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  onClear: () => void;
};

function FilterPill({ label, options, selected, onToggle, onClear }: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const count = selected.size;
  const hasOptions = options.length > 0;

  return (
    <div className={`filter-pill-wrapper ${open ? "is-open" : ""}`} ref={ref}>
      <button
        className={`filter-pill ${count > 0 ? "is-active" : ""}`}
        disabled={!hasOptions}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span>
          {label}
          {count > 0 && <span className="filter-pill__count">{count}</span>}
        </span>
        <img alt="" src={dropdownIcon} />
      </button>

      {open && hasOptions && (
        <div className="filter-pill__dropdown" role="listbox">
          <div className="filter-pill__dropdown-header">
            <span>{label}</span>
            {count > 0 && (
              <button
                className="filter-pill__clear-link"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                type="button"
              >
                Clear
              </button>
            )}
          </div>
          <ul>
            {options.map((opt) => {
              const checked = selected.has(opt);
              return (
                <li key={opt}>
                  <label className={`filter-pill__option ${checked ? "is-checked" : ""}`}>
                    <input
                      checked={checked}
                      onChange={() => onToggle(opt)}
                      type="checkbox"
                    />
                    <span className="filter-pill__checkbox" />
                    <span className="filter-pill__option-label">{opt}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── PriceFilterPill – min/max range ─────────────────────────────────────────

type PriceFilterPillProps = {
  minPrice: number | null;
  maxPrice: number | null;
  priceMin: string;
  priceMax: string;
  onPriceMin: (v: string) => void;
  onPriceMax: (v: string) => void;
  onClear: () => void;
};

function PriceFilterPill({
  minPrice,
  maxPrice,
  priceMin,
  priceMax,
  onPriceMin,
  onPriceMax,
  onClear,
}: PriceFilterPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const isActive = priceMin !== "" || priceMax !== "";
  const hasProducts = minPrice !== null || maxPrice !== null;

  return (
    <div className={`filter-pill-wrapper ${open ? "is-open" : ""}`} ref={ref}>
      <button
        className={`filter-pill ${isActive ? "is-active" : ""}`}
        disabled={!hasProducts}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span>
          Price
          {isActive && <span className="filter-pill__count">✓</span>}
        </span>
        <img alt="" src={dropdownIcon} />
      </button>

      {open && (
        <div className="filter-pill__dropdown filter-pill__dropdown--price" role="dialog">
          <div className="filter-pill__dropdown-header">
            <span>Price Range</span>
            {isActive && (
              <button
                className="filter-pill__clear-link"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                type="button"
              >
                Clear
              </button>
            )}
          </div>
          <div className="filter-pill__price-row">
            <div className="filter-pill__price-field">
              <label>Min (£)</label>
              <input
                min="0"
                placeholder={minPrice !== null ? String(Math.floor(minPrice)) : "0"}
                type="number"
                value={priceMin}
                onChange={(e) => onPriceMin(e.target.value)}
              />
            </div>
            <span className="filter-pill__price-dash">–</span>
            <div className="filter-pill__price-field">
              <label>Max (£)</label>
              <input
                min="0"
                placeholder={maxPrice !== null ? String(Math.ceil(maxPrice)) : "∞"}
                type="number"
                value={priceMax}
                onChange={(e) => onPriceMax(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SearchBar ───────────────────────────────────────────────────────────────

type SearchBarProps = {
  placeholder: string;
  className?: string;
  products: SanityProduct[];
  onSearch: (query: string) => void;
};

function SearchBar({ placeholder, className, products, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SanityProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // SSR guard — portal needs document.body
  useEffect(() => setMounted(true), []);

  // Click-outside: close if click is outside BOTH the input wrapper AND the
  // portalled dropdown. Standard useClickOutside won't work because the portal
  // lives outside wrapperRef in the DOM tree.
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideWrapper && !insideDropdown) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function calcPos() {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDropdownPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  // ─ Core search logic ─────────────────────────────────────────────────────
  // Filters as-you-type (instant), plus shows suggestion dropdown.

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      onSearch("");
      return;
    }

    // Instant filter — products grid updates on every keystroke
    onSearch(trimmed);

    // Build suggestions
    const matched = products
      .filter((p) => matchesQuery(p, trimmed))
      .slice(0, 8);
    setSuggestions(matched);

    if (matched.length > 0) {
      calcPos();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter should ALWAYS commit search (even if dropdown is closed)
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && activeIndex >= 0) {
        selectSuggestion(suggestions[activeIndex]);
      } else {
        commitSearch(query);
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    // Arrow keys only when dropdown is open
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    }
  }

  function selectSuggestion(product: SanityProduct) {
    setQuery(product.name);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    onSearch(product.name);
  }

  function commitSearch(value: string) {
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    onSearch(value.trim());
  }

  function handleClear() {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    onSearch("");
    inputRef.current?.focus();
  }

  function highlightMatch(text: string, q: string) {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase().trim());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + q.trim().length)}</mark>
        {text.slice(idx + q.trim().length)}
      </>
    );
  }

  // ─ Portal dropdown ───────────────────────────────────────────────────────
  // Rendered into document.body so it escapes the sticky header's stacking
  // context and always paints on top.

  const suggestionsDropdown =
    mounted && isOpen && suggestions.length > 0 && dropdownPos
      ? createPortal(
          <ul
            ref={dropdownRef}
            className="shop-search__suggestions"
            role="listbox"
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
          >
            {suggestions.map((product, index) => (
              <li
                key={product._id}
                role="option"
                aria-selected={index === activeIndex}
                className={`shop-search__suggestion-item ${
                  index === activeIndex ? "is-active" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur → keeps dropdown alive
                  selectSuggestion(product);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div className="shop-search__suggestion-media">
                  {product.image ? (
                    <img alt={product.name} src={product.image} />
                  ) : (
                    <NoImage />
                  )}
                </div>
                <div className="shop-search__suggestion-info">
                  <span className="shop-search__suggestion-name">
                    {highlightMatch(product.name, query)}
                  </span>
                  <span className="shop-search__suggestion-code">
                    {product.code}
                  </span>
                </div>
              </li>
            ))}
          </ul>,
          document.body
        )
      : null;

  return (
    <div
      className={`shop-search-wrapper ${className ?? ""}`.trim()}
      ref={wrapperRef}
    >
      <label className="shop-search">
        <img alt="" className="shop-search__icon" src={searchIcon} />
        <input
          aria-autocomplete="list"
          aria-expanded={isOpen}
          placeholder={placeholder}
          ref={inputRef}
          role="combobox"
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              calcPos();
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            aria-label="Clear search"
            className="shop-search__clear"
            type="button"
            onClick={handleClear}
          >
            ✕
          </button>
        )}
      </label>
      {suggestionsDropdown}
    </div>
  );
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

type ProductCardProps = { product: SanityProduct; variant: "grid" | "list" };

function ProductCard({ product, variant }: ProductCardProps) {
  const { items, addToCart, updateQuantity } = useCart();
  const router = useRouter();
  const href = `/product/${product._id}`;
  const cartItem = items.find((item) => item._id === product._id);
  const quantity = cartItem?.quantity ?? 0;

  function handleAddToCart(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      _id: product._id,
      name: product.name,
      code: product.code,
      unit: product.unit,
      weight: product.weight,
      price: product.price,
      image: product.image,
    });
  }

  function handleDecrease(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, Math.max(0, quantity - 1));
  }

  function handleIncrease(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (quantity === 0) {
      handleAddToCart(e);
      return;
    }
    updateQuantity(product._id, quantity + 1);
  }

  function handleCardClick() {
    router.push(href);
  }

  function handleCardKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(href);
    }
  }

  function renderCartControl(isList = false) {
    if (product.outOfStock) {
      return (
        <button className="shop-product-card__add-btn shop-product-card__add-btn--disabled" type="button" disabled>
          <span>Out of Stock</span>
        </button>
      );
    }

    if (quantity < 1) {
      return (
        <button className="shop-product-card__add-btn" type="button" onClick={handleAddToCart}>
          <span>Add to Cart</span>
          <img alt="" src={plusIcon} />
        </button>
      );
    }

    return (
      <div
        className={`shop-product-card__quantity-control${isList ? " shop-product-card__quantity-control--list" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="shop-product-card__quantity-btn"
          type="button"
          aria-label={`Decrease quantity of ${product.name}`}
          onClick={handleDecrease}
        >
          <img alt="" src={listQtyMinusIcon} />
        </button>
        <span className="shop-product-card__quantity-value" aria-live="polite">{quantity}</span>
        <button
          className="shop-product-card__quantity-btn shop-product-card__quantity-btn--plus"
          type="button"
          aria-label={`Increase quantity of ${product.name}`}
          onClick={handleIncrease}
        >
          <img alt="" src={listQtyPlusIcon} />
        </button>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <article
        className={`shop-product-card shop-product-card--list shop-product-card--interactive ${product.outOfStock ? 'shop-product-card--out-of-stock' : ''}`}
        role="link"
        tabIndex={product.outOfStock ? -1 : 0}
        onClick={product.outOfStock ? undefined : handleCardClick}
        onKeyDown={product.outOfStock ? undefined : handleCardKeyDown}
      >
        <div className="shop-product-card__media shop-product-card__media--list">
          {product.image ? (
            <img alt={product.name} src={product.image} />
          ) : (
            <NoImage />
          )}
          {product.outOfStock && (
            <div className="shop-product-card__oos-overlay">
              <span>OUT OF STOCK</span>
            </div>
          )}
        </div>
        <div className="shop-product-card__content shop-product-card__content--list">
          <div className="shop-product-card__head shop-product-card__head--list">
            <div>
              <h3>{product.name}</h3>
              <p>Product code : {product.code}</p>
            </div>
            <span className="shop-product-card__badge">{product.badge}</span>
          </div>
          <dl className="shop-product-card__meta shop-product-card__meta--list">
            <div><dt>Unit</dt><dd>{product.unit}</dd></div>
            <div><dt>Weight</dt><dd>{product.weight}</dd></div>
          </dl>
          <div className="shop-product-card__footer shop-product-card__footer--list">
            <p>{product.price}</p>
            {renderCartControl(true)}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`shop-product-card shop-product-card--interactive ${product.outOfStock ? 'shop-product-card--out-of-stock' : ''}`}
      role="link"
      tabIndex={product.outOfStock ? -1 : 0}
      onClick={product.outOfStock ? undefined : handleCardClick}
      onKeyDown={product.outOfStock ? undefined : handleCardKeyDown}
    >
      <div className="shop-product-card__media">
        {product.image ? (
          <img alt={product.name} src={product.image} />
        ) : (
          <NoImage />
        )}
        {product.outOfStock && (
          <div className="shop-product-card__oos-overlay">
            <span>OUT OF STOCK</span>
          </div>
        )}
      </div>
      <div className="shop-product-card__content">
        <div className="shop-product-card__head">
          <h3>{product.name}</h3>
          <p>Product code : {product.code}</p>
        </div>
        <dl className="shop-product-card__meta">
          <div><dt>Unit</dt><dd>{product.unit}</dd></div>
          <div><dt>Weight</dt><dd>{product.weight}</dd></div>
        </dl>
        <div className="shop-product-card__footer">
          <p>{product.price}</p>
          {renderCartControl()}
        </div>
      </div>
    </article>
  );
}

// ─── CartScrollArea – real DOM custom scrollbar (macOS-proof) ────────────────
//
// macOS overlays scrollbars and hides them regardless of CSS.
// The only reliable fix is to build the scrollbar as actual DOM nodes.
//
function CartScrollArea({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ top: 0, height: 0 });
  const [canScroll, setCanScroll] = useState(false);

  const recalc = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight + 1;
    setCanScroll(scrollable);
    if (scrollable) {
      const ratio    = el.clientHeight / el.scrollHeight;
      const h        = Math.max(ratio * el.clientHeight, 36);
      const maxScroll = el.scrollHeight - el.clientHeight;
      const maxTop   = el.clientHeight - h;
      setThumb({
        height: h,
        top: maxScroll > 0 ? (el.scrollTop / maxScroll) * maxTop : 0,
      });
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    recalc();
    el.addEventListener("scroll", recalc, { passive: true });
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", recalc);
      ro.disconnect();
    };
  }, [recalc]);

  return (
    <div className="cart-scroll-area">
      <div ref={scrollRef} className="shop-cart-panel__items-list">
        {children}
      </div>
      {/* Always-visible custom scrollbar track + thumb */}
      <div className="cart-scrollbar-track" aria-hidden>
        <div
          className="cart-scrollbar-thumb"
          style={{
            height: thumb.height,
            transform: `translateY(${thumb.top}px)`,
            opacity: canScroll ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}

// ─── CartPanel (live) ─────────────────────────────────────────────────────────

function CartPanel() {
  const { items, subtotal, updateQuantity, removeFromCart, hydrated } = useCart();
  const router = useRouter();

  const formatINR = (n: number) =>
    `£ ${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Loading skeleton — shown until localStorage has been read ──────────────
  if (!hydrated) {
    return (
      <div className="shop-cart-panel__skeleton">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shop-cart-panel__skeleton-item">
            <div className="shop-cart-panel__skeleton-thumb shimmer" />
            <div className="shop-cart-panel__skeleton-lines">
              <div className="shop-cart-panel__skeleton-line shop-cart-panel__skeleton-line--title shimmer" />
              <div className="shop-cart-panel__skeleton-line shop-cart-panel__skeleton-line--sub shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="shop-cart-panel__empty">
        <img alt="" src={cartIcon} />
        <p>Cart is empty — add items</p>
      </div>
    );
  }

  return (
    <div className="shop-cart-panel__filled">
      <CartScrollArea>
        {items.map((item) => (
          <div className="shop-cart-panel__item" key={item._id}>
            <div className="shop-cart-panel__item-media">
              {item.image ? (
                <img alt={item.name} src={item.image} />
              ) : (
                <NoImage />
              )}
            </div>
            <div className="shop-cart-panel__item-main">
              <h3>{item.name}</h3>
              <div className="shop-cart-panel__item-controls">
                <div className="shop-cart-panel__quantity">
                  <button
                    className="shop-cart-panel__quantity-button shop-cart-panel__quantity-button--minus"
                    type="button"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  >
                    <img alt="" src={listQtyMinusIcon} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="shop-cart-panel__quantity-button shop-cart-panel__quantity-button--plus"
                    type="button"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  >
                    <img alt="" src={listQtyPlusIcon} />
                  </button>
                </div>
                <button
                  className="shop-cart-panel__delete"
                  type="button"
                  onClick={() => removeFromCart(item._id)}
                >
                  <img alt="Remove" src={cartDeleteIcon} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </CartScrollArea>

      <div className="shop-cart-panel__subtotal">
        <p>Subtotal</p>
        <p>{formatINR(subtotal)}</p>
      </div>

      <button
        className="shop-cart-panel__checkout"
        type="button"
        onClick={() => router.push("/cart-page")}
      >
        <span>Proceed to Checkout</span>
        <img alt="" src={cartProceedIcon} />
      </button>
    </div>
  );
}

// ─── HeroSlider ───────────────────────────────────────────────────────────────

function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const rotateSlide = useEffectEvent(() => {
    if (slides.length > 0) setActiveSlide((c) => (c + 1) % slides.length);
  });

  useEffect(() => {
    const id = window.setInterval(rotateSlide, 4500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="shop-hero">
      <div className="shop-hero__track" style={{ transform: `translate3d(-${activeSlide * 100}%, 0, 0)` }}>
        {slides.map((s) => (
          <div className="shop-hero__slide" key={s.id}>
            <img alt={s.alt || ""} src={s.image} />
          </div>
        ))}
      </div>
      <div className="shop-hero__dots">
        {slides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to slide ${i + 1}`}
            className={i === activeSlide ? "is-active" : ""}
            type="button"
            onClick={() => setActiveSlide(i)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── ShopPageScreen ───────────────────────────────────────────────────────────

export function ShopPageScreen({
  heroSlides,
  categories = [],
  initialProducts = [],
  totalProductCount,
  pageSize,
  catalogMetadata,
  hasNewArrivals,
}: {
  heroSlides?: HeroSlide[];
  categories?: SanityCategory[];
  initialProducts?: SanityProduct[];
  totalProductCount: number;
  pageSize: number;
  catalogMetadata: CatalogMetadata;
  hasNewArrivals?: boolean;
}) {
  const { totalItems } = useCart();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isMobileCategoryModalOpen, setIsMobileCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim() !== "") {
      setActiveCategoryId(null);
    }
  }, []);
  const [weightFilter, setWeightFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [unitFilter, setUnitFilter] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [loadedProducts, setLoadedProducts] = useState<SanityProduct[]>(initialProducts);
  const [resultTotal, setResultTotal] = useState(totalProductCount);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProductCount);
  const [nextOffset, setNextOffset] = useState(initialProducts.length);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const hasBootstrappedRef = useRef(false);

  // We now rely on Sanity's "order(order asc)" query to provide the correct sorting
  const sortedCategories = useMemo(() => {
    return [...categories];
  }, [categories]);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // ── Category chip-row scroll arrows ──────────────────────────────────────
  const chipRowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateChipArrows = useCallback(() => {
    const el = chipRowRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 4);
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = chipRowRef.current;
    if (!el) return;
    updateChipArrows();
    el.addEventListener("scroll", updateChipArrows, { passive: true });
    const ro = new ResizeObserver(updateChipArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateChipArrows);
      ro.disconnect();
    };
  }, [updateChipArrows]);

  function scrollChips(direction: "left" | "right") {
    const el = chipRowRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -240 : 240, behavior: "smooth" });
  }

  const weightOptions = useMemo(() => catalogMetadata.weightOptions, [catalogMetadata.weightOptions]);
  const tagOptions = useMemo(() => catalogMetadata.tagOptions, [catalogMetadata.tagOptions]);
  const unitOptions = useMemo(() => catalogMetadata.unitOptions, [catalogMetadata.unitOptions]);
  const globalMinPrice = catalogMetadata.globalMinPrice;
  const globalMaxPrice = catalogMetadata.globalMaxPrice;

  const totalActiveFilters =
    weightFilter.size + tagFilter.size + unitFilter.size +
    (priceMin !== "" ? 1 : 0) + (priceMax !== "" ? 1 : 0);

  const hasActiveFilters = totalActiveFilters > 0 || debouncedSearchQuery !== "" || activeCategoryId !== null;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  function clearAllFilters() {
    setWeightFilter(new Set());
    setTagFilter(new Set());
    setUnitFilter(new Set());
    setPriceMin("");
    setPriceMax("");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setActiveCategoryId(null);
  }

  function toggleSetFilter(setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) {
    setter((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  }

  const categoryCountMap = useMemo(() => {
    return new Map(categories.map((category) => [category._id, category.count ?? 0]));
  }, [categories]);

  const buildProductsUrl = useCallback((offset: number) => {
    const params = new URLSearchParams();
    params.set("offset", String(offset));
    params.set("limit", String(pageSize));
    if (activeCategoryId) params.set("categoryId", activeCategoryId);
    if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
    if (weightFilter.size > 0) params.set("weights", Array.from(weightFilter).join(","));
    if (tagFilter.size > 0) params.set("tags", Array.from(tagFilter).join(","));
    if (unitFilter.size > 0) params.set("units", Array.from(unitFilter).join(","));
    if (priceMin !== "") params.set("priceMin", priceMin);
    if (priceMax !== "") params.set("priceMax", priceMax);
    return `/api/products?${params.toString()}`;
  }, [activeCategoryId, debouncedSearchQuery, pageSize, priceMax, priceMin, tagFilter, unitFilter, weightFilter]);

  const fetchProducts = useCallback(async (offset: number, mode: "replace" | "append") => {
    const requestId = ++requestIdRef.current;
    if (mode === "replace") {
      setIsLoadingList(true);
      setLoadError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await fetch(buildProductsUrl(offset), { cache: "no-store" });
      const data = await response.json() as ProductsApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to load products");
      }

      if (requestId !== requestIdRef.current) return;

      setResultTotal(data.total);
      setHasMore(data.hasMore);
      setNextOffset(data.nextOffset);
      setLoadError(null);

      setLoadedProducts((prev) => {
        if (mode === "replace") return data.products;
        const merged = new Map(prev.map((product) => [product._id, product]));
        data.products.forEach((product) => merged.set(product._id, product));
        return Array.from(merged.values());
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLoadError(error instanceof Error ? error.message : "Failed to load products");
      if (mode === "replace") {
        setLoadedProducts([]);
        setResultTotal(0);
        setHasMore(false);
        setNextOffset(0);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingList(false);
        setIsLoadingMore(false);
      }
    }
  }, [buildProductsUrl]);

  useEffect(() => {
    const isInitialState = !activeCategoryId && !debouncedSearchQuery && weightFilter.size === 0 && tagFilter.size === 0 && unitFilter.size === 0 && priceMin === "" && priceMax === "";

    if (!hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      if (isInitialState) return;
    }

    void fetchProducts(0, "replace");
  }, [activeCategoryId, debouncedSearchQuery, fetchProducts, priceMax, priceMin, tagFilter, unitFilter, weightFilter]);

  const visibleProducts = loadedProducts;

  function handleLoadMore() {
    if (!hasMore || isLoadingMore) return;
    void fetchProducts(nextOffset, "append");
  }

  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;

    if (!trigger || !hasMore || isLoadingList || isLoadingMore || loadError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "240px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, hasMore, isLoadingList, isLoadingMore, loadError]);

  return (
    <section className="shop-page">
      {/* ── Header ── */}
      <header className="shop-page__header">
        <div className="shop-brand">
          <img alt="Indo Asian Foods logo" className="shop-brand__logo" src={brandLogo} />
          <p>INDO ASIAN FOODS LTD</p>
        </div>
        <div className="shop-page__header-actions">
          {hasNewArrivals && (
            <Link href="/new-arrivals" className="shop-new-arrivals-link">
              New Arrivals
            </Link>
          )}
          <SearchBar placeholder="Search products…" products={loadedProducts} onSearch={handleSearch} />
          <Link href="/cart-page" className="shop-cart-button">
            <img alt="" src={cartIcon} />
            {totalItems > 0 && <span>{totalItems}</span>}
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      {heroSlides && heroSlides.length > 0 && <HeroSlider slides={heroSlides} />}

      {/* ── Category chip row ── */}
      {categories.length > 0 && (
        <div className="shop-chip-row-outer">
          {/* Left scroll arrow — desktop only */}
          {showLeftArrow && (
            <button
              aria-label="Scroll categories left"
              className="shop-chip-arrow shop-chip-arrow--left"
              type="button"
              onClick={() => scrollChips("left")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          <div className="shop-chip-row" ref={chipRowRef} role="tablist">
            <button
              className="shop-chip-categories-btn"
              onClick={() => setIsMobileCategoryModalOpen(true)}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16" style={{ marginRight: 6 }}>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              Categories
            </button>
            {sortedCategories.map((cat) => {
              const count = categoryCountMap.get(cat._id) ?? 0;
              return (
                <button
                  key={cat._id}
                  className={activeCategoryId === cat._id ? "is-active" : ""}
                  onClick={() => setActiveCategoryId(cat._id)}
                  type="button"
                >
                  {cat.name} ({count})
                </button>
              );
            })}
            <button
              className={activeCategoryId === null ? "is-active" : ""}
              onClick={() => setActiveCategoryId(null)}
              type="button"
            >
              All ({totalProductCount})
            </button>
          </div>

          {/* Right scroll arrow — desktop only */}
          {showRightArrow && (
            <button
              aria-label="Scroll categories right"
              className="shop-chip-arrow shop-chip-arrow--right"
              type="button"
              onClick={() => scrollChips("right")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="shop-filter-bar-outer">
        <section className="shop-filter-bar">
          <div className="shop-filter-bar__left">
            <button
              className={`shop-filter-bar__filters ${totalActiveFilters > 0 ? "is-active" : ""}`}
              type="button"
              onClick={totalActiveFilters > 0 ? clearAllFilters : undefined}
            >
              <img alt="" src={filterIcon} />
              <span>
                {totalActiveFilters > 0
                  ? `Filters (${totalActiveFilters}) — Clear`
                  : "Filters"}
              </span>
            </button>

            <div className="shop-filter-bar__pill-group">
              <FilterPill
                label="Weight"
                options={weightOptions}
                selected={weightFilter}
                onToggle={(v) => toggleSetFilter(setWeightFilter, v)}
                onClear={() => setWeightFilter(new Set())}
              />
              <FilterPill
                label="Tag"
                options={tagOptions}
                selected={tagFilter}
                onToggle={(v) => toggleSetFilter(setTagFilter, v)}
                onClear={() => setTagFilter(new Set())}
              />
              <FilterPill
                label="Unit"
                options={unitOptions}
                selected={unitFilter}
                onToggle={(v) => toggleSetFilter(setUnitFilter, v)}
                onClear={() => setUnitFilter(new Set())}
              />
              <PriceFilterPill
                minPrice={globalMinPrice}
                maxPrice={globalMaxPrice}
                priceMin={priceMin}
                priceMax={priceMax}
                onPriceMin={setPriceMin}
                onPriceMax={setPriceMax}
                onClear={() => { setPriceMin(""); setPriceMax(""); }}
              />
            </div>
          </div>

          <div className="shop-filter-bar__right">
            <button
              className="shop-filter-bar__view"
              onClick={() => setViewMode((c) => (c === "grid" ? "list" : "grid"))}
              type="button"
            >
              <span>{viewMode === "grid" ? "List View" : "Grid View"}</span>
              <img alt="" src={viewMode === "grid" ? listIcon : gridIcon} />
            </button>
          </div>
        </section>
      </div>

      {/* ── Catalog ── */}
      <section className="shop-catalog">
        <aside className="shop-sidebar">
          <div className="shop-sidebar__inner">
            {sortedCategories.map((cat) => {
              const count = categoryCountMap.get(cat._id) ?? 0;
              return (
                <button
                  key={cat._id}
                  className={activeCategoryId === cat._id ? "is-active" : ""}
                  onClick={() => setActiveCategoryId(cat._id)}
                  type="button"
                >
                  {cat.name} ({count})
                </button>
              );
            })}
            <button
              className={activeCategoryId === null ? "is-active" : ""}
              onClick={() => setActiveCategoryId(null)}
              type="button"
            >
              All ({totalProductCount})
            </button>
          </div>
        </aside>

        <div className="shop-results">
          <div className="shop-results__top">
            <div className="shop-results__heading">
              <h2>
                {hasActiveFilters ? "Filtered Products" : "Showing All Products"}
              </h2>
              <p>
                <span>{resultTotal}</span> Products Available
              </p>
            </div>
            <SearchBar
              className="shop-results__search"
              placeholder="Search products…"
              products={loadedProducts}
              onSearch={handleSearch}
            />
          </div>

          {loadError && (
            <div className="shop-results__empty">
              <p>{loadError}</p>
              <button
                className="shop-results__empty-reset"
                onClick={() => void fetchProducts(0, "replace")}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {!loadError && !isLoadingList && visibleProducts.length === 0 && (
            <div className="shop-results__empty">
              <p>No products match the current filters.</p>
              <button
                className="shop-results__empty-reset"
                onClick={clearAllFilters}
                type="button"
              >
                Clear all filters
              </button>
            </div>
          )}

          <div className={viewMode === "list" ? "shop-results__grid shop-results__grid--list" : "shop-results__grid"}>
            {visibleProducts.map((product) => (
              <ProductCard key={product._id} product={product} variant={viewMode} />
            ))}
          </div>

          {isLoadingList && (
            <div className="shop-results__loading">
              <p>Loading products…</p>
            </div>
          )}

          {!loadError && hasMore && (
            <div className="shop-results__load-more">
              <div ref={loadMoreTriggerRef} aria-hidden="true" />
              {isLoadingMore && <p>Loading more products…</p>}
            </div>
          )}
        </div>

        <aside className="shop-cart-panel">
          <div className="shop-cart-panel__inner">
            <h2>Cart</h2>
            <CartPanel />
          </div>
        </aside>
      </section>

      {/* ── Mobile Category Drawer ── */}
      {isMobileCategoryModalOpen && (
        <div className="shop-mobile-category-drawer">
          <div className="shop-mobile-category-drawer__backdrop" onClick={() => setIsMobileCategoryModalOpen(false)} />
          <div className="shop-mobile-category-drawer__content">
            <div className="shop-mobile-category-drawer__header">
              <h2>Categories</h2>
              <button onClick={() => setIsMobileCategoryModalOpen(false)} aria-label="Close categories">✕</button>
            </div>
            <div className="shop-mobile-category-drawer__body">
              {sortedCategories.map((cat) => {
                const count = categoryCountMap.get(cat._id) ?? 0;
                return (
                  <button
                    key={cat._id}
                    className={activeCategoryId === cat._id ? "is-active" : ""}
                    onClick={() => { setActiveCategoryId(cat._id); setIsMobileCategoryModalOpen(false); }}
                    type="button"
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
              <button
                className={activeCategoryId === null ? "is-active" : ""}
                onClick={() => { setActiveCategoryId(null); setIsMobileCategoryModalOpen(false); }}
                type="button"
              >
                All ({totalProductCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
