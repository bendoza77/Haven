# Haven — e-commerce frontend

A production-quality storefront UI built with **Next.js (App Router), React, TypeScript and Tailwind CSS v4**.

This is a **frontend-only** project. There is no backend, database, API, authentication,
payment processing or order system. Every screen is rendered from local mock data, and
buttons either navigate or change local visual state. The sign-in and sign-up screens
validate properly but do not authenticate: a valid submit routes to `/account`, and the
Google button is a marked hand-off point for a real OAuth redirect.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # eslint
```

## Routes

| Route               | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `/`                 | Home — hero, categories, featured, promo, new arrivals, popular    |
| `/shop`             | All products with filters, sort and pagination                    |
| `/categories`       | Category overview                                                 |
| `/category/[slug]`  | One category, same browsing UI as the shop                        |
| `/product/[slug]`   | Product detail — gallery, options, details, related products      |
| `/cart`             | Cart with quantity, removal and order summary                     |
| `/checkout`         | Customer, shipping, delivery, payment and summary (visual only)   |
| `/wishlist`         | Saved products with removal                                       |
| `/account`          | Profile, orders, addresses and settings (`?tab=`)                 |
| `/login`            | Sign in — Google, email and password, remember me                 |
| `/register`         | Create account — Google, name, email, password strength, consent  |
| `/forgot-password`  | Request a reset link, with an inline sent state                   |
| `/search`           | Search field, result count, results and empty state (`?q=`)       |
| 404                 | `app/not-found.tsx`                                               |

`?sort=`, `?filter=sale` and `?page=` are read on the server and applied to the mock
catalogue in memory. Price, colour and rating filters are presentational.

## Structure

```
app/                    routes, layouts, loading skeletons, 404
  (auth)/               sign in, create account, reset password
components/
  auth/                 auth shell, fields, forms, Google button
  layout/               header, footer, mobile drawer, nav link
  sections/             home page sections (hero, benefits, promo)
  product/              product card, grid, gallery, options, browser, filters
  category/             category card
  cart/                 cart list and order summary
  ui/                   button, badge, price, rating, field, pagination, …
data/
  catalog.ts            categories, products and selectors
  mock-user.ts          cart, wishlist, orders, addresses
lib/
  auth.ts               email, name and password rules; strength score
  theme.ts              theme preference, pre-paint script, change store
  site.ts               brand details and navigation maps
  shop.ts               sort options, page size, URL helpers
  utils.ts              class names, price formatting
app/globals.css         design tokens (colour, radius, shadow, fonts)
```

## Design system

All tokens live in `app/globals.css` under `@theme`, so components never invent their
own colours or radii:

- **Surfaces** `canvas`, `surface`, `surface-strong`
- **Text** `ink`, `ink-muted`, `ink-subtle`
- **Lines** `line`, `line-strong`
- **Accent / status** `accent`, `success`, `warning`, `danger`
- **Always-dark panels** `feature`, `feature-ink`
- **Radius** `sm`, `md`, `lg` — **Shadows** `card`, `pop`
- **Type** Geist for UI, Instrument Serif for display headings

## Light and dark

The theme is one attribute — `data-theme="light" | "dark"` on `<html>` — and every token
above is redefined under it in `app/globals.css`. Components never branch on the theme:
they read the token and stay exactly as written, which is why dark mode reaches every
surface, border, shadow, badge and form control rather than the pages someone remembered
to visit. `color-scheme` is set alongside it so native selects, checkboxes and scrollbars
follow too.

Two token pairs exist because `bg-ink text-canvas` means two different things. Primary
buttons, badges and pagination are *inverted* surfaces — they flip with the theme. The
announcement bar, promo banner, auth panel and the scrims over photography are *dark*
surfaces that must stay dark in both themes; those use `feature` / `feature-ink`.

`lib/theme.ts` holds the preference (`system`, `light`, `dark`, stored under
`haven-theme`) and a small pre-paint script the root layout inlines as the first element
in `<body>`, so a page is never drawn in the wrong theme and corrected afterwards. The
controls in `components/ui/ThemeToggle.tsx` read that state through `useSyncExternalStore`
rather than `useState` + `useEffect`: no hydration mismatch, no flash of the wrong icon,
and a change in one tab reaches the others. `system` keeps following the OS as it changes.

## Rendering

Server Components by default. Client Components are limited to the pieces that need
browser state: the mobile drawer, the active nav link, the product gallery and options,
the quantity stepper, the sort select, the cart and wishlist lists, the theme controls,
and the three auth forms.

The auth routes are fully prerendered (`○ Static`) and carry no image request at all —
the brand panel beside each form is type and CSS, so the largest paint is the heading,
drawn with fonts the root layout has already loaded. Fields are uncontrolled and read
through `FormData` on submit, so typing re-renders nothing; only the sign-up strength
meter keeps a value in state, inside its own field component. Validation mirrors the
account API rules (3–50 character name, 6–50 character password, no spaces), runs on
blur, clears as soon as you type, and moves focus to the first field it rejects.

Product images come from Unsplash and are served through `next/image`
(`images.remotePatterns` in `next.config.ts`).
