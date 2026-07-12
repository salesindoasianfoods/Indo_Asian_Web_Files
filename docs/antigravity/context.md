# Indo Asian Foods - Antigravity Context

This document summarizes the current state of the Indo Asian Foods e-commerce project to allow for a seamless transition between AI sessions.

## 1. Project Overview
A Next.js 15+ (App Router) e-commerce storefront for **Indo Asian Foods Ltd**, integrated with **Sanity.io** for product management and **Green API** for WhatsApp order notifications.

## 2. Recent Accomplishments

### 🛍️ Cart & Hydration
- **Hydration Fix:** Implemented a `hydrated` state in `CartContext` to prevent UI flickering. The cart now shows a **shimmer skeleton loader** while reading from `localStorage`.
- **Custom Scrollbar:** Created `CartScrollArea` to ensure an always-visible scrollbar in the cart panel across all devices (including macOS overlay scrollbars).
- **Product Detail Integration:** Fully wired the Product Detail page to `CartContext`. The header cart count now syncs, and "Add to Cart" (including quantity and related products) is fully functional.

### 🔍 Search & UI/UX
- **Search Portal:** Migrated the search suggestions dropdown to a React Portal to fix clipping/stacking issues.
- **Search Logic:** Implemented "as-you-type" filtering and instant responsiveness.
- **Login Page:** Replaced the text-based placeholder logo with the official brand image. The logo is now clickable and routes back to the homepage.

### 🚀 Checkout & WhatsApp
- **Automated Orders:** Integrated with Green API to send order summaries to the owner's WhatsApp.
- **Bulletproof Fallback:** Added a client-side redirection to `wa.me` in the checkout flow. If the background API fails, the user is automatically prompted to send the order summary via their own WhatsApp.
- **Green API Status:** Previously "Not Authorized" due to disconnection; user has re-scanned the QR code, but the fallback remains as a safety measure.

### 📈 SEO & Branding
- **Metadata:** Configured robust SEO tags, OpenGraph metadata, and title templates in `layout.tsx`.
- **Favicon:** Scrubbed the default Next.js favicon. Replaced it with `src/app/favicon.ico` and added `?v=5` cache-busters to metadata links to force browser updates.

## 3. Current Task & Blockers

### ❗ The Vercel Login Issue
**Status:** In Progress (Analyzing)
**Symptoms:** The login system works perfectly on `localhost`, but on the Vercel production build, entering the password results in "nothing happening" (silent failure or failed authentication).

**Key Files to Investigate:**
- `src/app/api/auth/login/route.ts`: Handles password verification against Sanity and sets the `site_auth` cookie.
- `src/middleware.ts` (if present): For checking authentication on protected routes.
- `.env` vs Vercel Environment Variables: Ensure `SITE_AUTH_SECRET`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, etc., are correctly set in the Vercel dashboard.

**Potential Culprits:**
1. **Cookie Security:** The `secure: process.env.NODE_ENV === "production"` flag in the login route might be causing issues if there's a protocol mismatch or if the `SITE_AUTH_SECRET` is missing in Vercel.
2. **Sanity Fetch:** Verify that the server-side Sanity fetch for `sitePassword` is succeeding in the production environment.
3. **API Pathing:** Ensure the frontend is calling the correct absolute or relative path for the login API.

## 4. Technical Stack
- **Framework:** Next.js 15+ (App Router)
- **Styling:** Vanilla CSS / SCSS
- **CMS:** Sanity.io
- **Auth:** Custom Cookie-based site password
- **Integrations:** Green API (WhatsApp)
