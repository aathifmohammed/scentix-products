# Scentix — Website Build Specification

## 1. Overview

Scentix is a perfume/attar brand. This site is a **single-page, scroll-driven product showcase** with no visible navigation chrome except a top filter bar. Products are browsed one at a time, centered on screen, with the page background dynamically matching the active product. A hidden `/admin` route lets the owner manage the product catalog (add/edit/delete/reorder).

There is **no cart, no checkout, no pricing** — this is a portfolio/catalog site. Every product card ends with a fixed contact line for wholesale/retail inquiries.

---

## 2. Tech Stack (recommended)

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion (for the scroll-driven scale/opacity/position transitions and background crossfades)
- **Scroll handling:** Framer Motion `useScroll` + `useTransform`, or a scroll-snap based approach — see Section 6 for exact behavior
- **Backend/DB:** A lightweight persistent store for products — e.g. Supabase (Postgres) or a simple SQLite/Prisma setup. Needs to support image URLs (not uploads — see Section 8), ordering, and CRUD.
- **Admin auth:** Single shared password for the admin route (no multi-user accounts, no public signup) — a login form backed by an env-var password + session cookie is sufficient.
- **Image handling:** Products store an **image URL** (external link), not an uploaded file. Use `next/image` with a remote loader, or a plain `<img>` with `object-fit: cover`.

---

## 3. Visual Theme

**Premium gold and black.**

- **Base background:** near-black (e.g. `#0a0a0a` – `#0d0d0d`), not pure `#000` — keeps the blurred product backgrounds from looking harsh against it.
- **Accent/primary:** gold (e.g. `#C9A227` / `#D4AF37` metallic gold range) — used for the active nav underline, dropdown hover states, category tags, borders/edges on the glass card, and the contact line text.
- **Glass card:** dark frosted glass — semi-transparent black (`rgba(10,10,10,0.4–0.55)`) with `backdrop-filter: blur(...)`, a thin gold-tinted border (`rgba(212,175,55,0.35)` or similar), and a soft gold-tinted glow/shadow rather than a plain black drop shadow — this is what makes the glass read as "premium" instead of generic frosted UI.
- **Typography:** a refined serif or high-contrast serif/sans pairing works well for a perfume brand — e.g. an elegant serif (like Playfair Display or Cormorant) for the product name, paired with a clean sans-serif (like Inter or Manrope) for volume/category/contact text. Product name in gold or off-white; supporting text in a muted warm gray/off-white for contrast against the black backdrop.
- **Nav bar:** black/near-black background (can be semi-transparent over the page background), gold text, gold underline or gold-glow on hover/active states, dropdowns matching the glass-card treatment (dark frosted panel, gold divider lines between items).
- **Overall feel:** boutique/luxury retail — generous spacing, restrained use of gold as an accent (not flooding the UI), and the product photography doing the visual heavy lifting.

---

## 4. Site Structure

Two routes only:

| Route | Purpose |
|---|---|
| `/` | Public-facing product showcase (the entire experience described below) |
| `/admin` | Hidden admin panel — not linked anywhere in the UI. Password protected. |

No header links, no footer nav, no breadcrumbs, no "Admin" button anywhere on the public site.

---

## 5. Top Filter Bar (the only navigation)

A single-row bar fixed to the top of the viewport, always visible.

**Top-level items (left to right):**
1. All Products
2. 22ml Perfumes
3. 50ml Perfumes
4. 100ml Perfumes
5. Body Spray
6. Attars

**Hover dropdown behavior:**
- Hovering **22ml Perfumes**, **50ml Perfumes**, **100ml Perfumes**, or **Body Spray** reveals a dropdown directly beneath it with: `All`, `Mens`, `Womens`, `Unisex`.
- **Attars** has no dropdown — clicking it filters directly to all attars, with no gender sub-menu.
- Clicking a top-level item with no sub-choice, or clicking a dropdown option, applies the filter immediately.
- Only **one filter is active at a time**. Selecting a new filter fully replaces the product set shown — the previously filtered set is not shown alongside it.
- The active filter should be visually indicated (underline, highlight, or similar) on the bar itself.

**Filtering rule:**
- Selecting a filter shows **only** the matching products in the central scroll experience (Section 6). Nothing else is rendered.

---

## 6. Central Scroll-Driven Product Showcase

This is the core interaction of the site. One product is "active" and centered on screen at a time; scrolling transitions to the next/previous product in the current filtered list.

### 5.1 Product Card (per product)

A **1:1 (square) image frame** containing:
- The product photo filling the frame (`object-fit: cover`)
- Product **name** in large, bold type
- **Volume** (e.g. "50ml")
- **Category** tag: Men / Women / Unisex
- Fixed line at the bottom: **"Contact 070 321 5170 for Wholesale & Retail Details"**

**Visual style:** glassmorphism — semi-transparent card background, `backdrop-filter: blur(...)`, soft border (e.g. `border: 1px solid rgba(255,255,255,0.2)`), subtle drop shadow. Text sits in a frosted overlay/panel over or below the image so it stays legible regardless of image content.

The card must be **responsive**: on desktop it's a large centered square (e.g. capped around 500–600px, scaling down on smaller viewports); on mobile it scales to fit width with margins, staying square.

### 5.2 Background

- The full-viewport background behind the card is the **currently active product's image**, heavily **blurred** and slightly darkened/tinted so the glass card and text remain readable.
- When the active product changes, the background **crossfades** to the new product's image in sync with the card transition (same duration/easing — they should feel like one motion, not two separate animations).

### 5.3 Scroll Transition Behavior

As the user scrolls down:

1. The **current active card**, sitting centered, begins to shrink and move upward, fading out as it approaches the top of the viewport (scale down + translateY up + opacity down, all driven by scroll position — not a fixed-duration animation, so it tracks the scroll exactly).
2. Simultaneously, the **next product's card** enters from the bottom of the viewport as a small, low-opacity element, and as scrolling continues it grows in scale, moves upward, and increases in opacity until it lands centered at full size — becoming the new active card.
3. The **background crossfade** (blurred image swap) happens in parallel, timed to complete roughly when the new card reaches center.
4. This should feel like one continuous, scrubbable motion tied to scroll position (e.g. each product occupies one "scroll section" akin to `100vh` per product, with the transform values interpolated via scroll progress within that section) — not click-triggered slides.
5. Scrolling up reverses the same motion symmetrically (previous product grows back in from the top / current shrinks down and exits toward the bottom).

**Implementation approach:** stack products in a tall scroll container (one section per product, each ~100vh), and use scroll-linked transforms (Framer Motion `useScroll`/`useTransform`, or CSS scroll-timeline) to map each section's scroll progress to: `scale`, `translateY`, and `opacity` for both the outgoing and incoming card, plus background image opacity crossfade.

### 5.4 Filtering interaction with scroll

Changing the top-bar filter resets the scroll position and rebuilds the stack using only the matching products, in the order defined by Section 9 (Sorting Rules).

---

## 7. Admin Panel (`/admin`)

Password-gated. Once authenticated, shows a management dashboard with:

- **Product list** (table or card list) showing all products with their current custom order.
- **Add Product** — form with the following fields and conditional logic:
  1. **Product Name** — text input.
  2. **Category (Product Type)** — dropdown: `Perfume` / `Body Spray` / `Attar`.
  3. **Volume** — dynamic based on the Category selection above:
     - If **Perfume** is selected → a second dropdown appears with options: `22ml`, `50ml`, `100ml`, `Other`.
       - If `Other` is selected → a text/number input appears for the admin to type a custom volume in ml (this still routes the product into a nav bucket — see note below).
     - If **Body Spray** or **Attar** is selected → no dropdown; instead a plain **number input field** appears for the admin to type the bottle's volume in ml directly (e.g. `150`).
  4. **Gender/Category tag** — dropdown: `Men` / `Women` / `Unisex`.
  5. **Image URL** — text input (external image link).
- **Edit Product** — same fields and same conditional show/hide logic as Add Product, pre-filled with the product's current values, editable in place.
- **Delete Product** — with a confirmation step before removing.
- **Reorder Products** — drag-and-drop (or up/down arrow buttons) to set custom order. This order is what drives the **"All Products"** view on the public site (see Section 9).

> **Nav routing for "Other" perfume volumes:** since the top nav only has 22ml / 50ml / 100ml Perfume buckets, a perfume saved with a custom "Other" volume (e.g. 30ml) won't cleanly match one of those three. Recommended handling: such products still appear under **"All Products"** (and within Perfume-wide contexts if any exist), but simply won't be pulled into the 22ml/50ml/100ml nav filters since their volume doesn't match those buckets. Flag this to the admin in the UI (e.g. a small note: "Custom volumes only appear under All Products, not the 22ml/50ml/100ml filters") so it's not a surprise.

All changes save immediately to the database and reflect on the public site without a rebuild/deploy (i.e. data-driven, not hardcoded).

---

## 8. Product Data Model

```
Product {
  id: string (uuid)
  name: string
  productType: enum          // "Perfume" | "BodySpray" | "Attar"
  volumeMl: number             // numeric volume in ml, always stored (e.g. 22, 50, 100, 30, 150)
  volumeLabel: string           // display string, e.g. "22ml", "50ml", "100ml", "30ml" — derived from volumeMl
  isCustomVolume: boolean        // true when a Perfume was saved via the "Other" option (volumeMl doesn't match 22/50/100)
  category: enum                  // "Men" | "Women" | "Unisex"
  imageUrl: string                 // external image link
  sortOrder: number                 // admin-controlled, used only for "All Products" view
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Admin form → data mapping:**
- Perfume + 22ml/50ml/100ml selected → `volumeMl` set from the dropdown, `isCustomVolume = false`.
- Perfume + "Other" selected → `volumeMl` set from the admin's number input, `isCustomVolume = true`.
- Body Spray or Attar → `volumeMl` set directly from the number input field (no dropdown), `isCustomVolume = false` (not applicable/relevant since these types don't have fixed nav buckets by volume anyway).

**Deriving nav placement from the data:**
- `productType = Perfume` + `volumeMl = 22` → shows under "22ml Perfumes"
- `productType = Perfume` + `volumeMl = 50` → "50ml Perfumes"
- `productType = Perfume` + `volumeMl = 100` → "100ml Perfumes"
- `productType = Perfume` + `isCustomVolume = true` → included in "All Products" only, not in any of the three volume-specific nav filters (see note in Section 7).
- `productType = BodySpray` → "Body Spray"
- `productType = Attar` → "Attars"
- `category` drives the Men/Women/Unisex sub-filter for the four dropdown-enabled nav items (22ml, 50ml, 100ml, Body Spray).

---

## 9. Sorting Rules

- **"All Products" view:** products appear in the exact order the admin set via drag-and-drop in the admin panel (`sortOrder` ascending).
- **Every other filtered view** (22ml, 50ml, 100ml, Body Spray, Attars, and any gender sub-filter within those): products appear in **alphabetical order by name**, regardless of admin's custom order.

---

## 10. Non-Functional Requirements

- Fully responsive: mobile, tablet, desktop. Card sizing, font scaling, and scroll-section height should adapt per breakpoint.
- Smooth 60fps transitions — prefer GPU-friendly properties (`transform`, `opacity`) over layout-triggering properties.
- No visible navigation/menu/footer beyond the top filter bar — the `/admin` route is only reachable by typing the URL directly.
- **Background blur must look good regardless of the source image's resolution** (admin-supplied images may be low-res, high-res, or inconsistent):
  - Always render the background image via `object-fit: cover` scaled to fill the viewport, then apply a strong blur (e.g. `blur(60–100px)`) — heavy blur hides pixelation/upscaling artifacts from lower-resolution images, so this works even for small source images.
  - Slightly **upscale** the element before blurring (e.g. `transform: scale(1.15–1.2)`) so blurred edge artifacts never show at the viewport boundary.
  - Layer a dark gold-tinted overlay/gradient (per the black/gold theme) on top of the blur so text and card contrast stay readable regardless of the image's own colors or brightness.
  - This approach is resolution-independent by design — no minimum image size needs to be enforced, though a short admin-facing note ("recommend at least 1000px on the shortest side for the sharp in-card image") is a reasonable soft guideline for the *card* image quality (separate from the blurred background, which forgives lower resolution).
- Image loading: show a placeholder/skeleton (blurred low-res or solid gold-black gradient) while each product image loads, to avoid pop-in during scroll transitions.

