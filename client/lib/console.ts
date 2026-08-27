import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, MessageSquare, Package, PlusCircle, Users } from "lucide-react";

/**
 * Both staff panels are the same design wearing two different sets of
 * affordances, so the difference lives here rather than in the screens:
 * the admin console draws edit and delete controls, the moderator console
 * draws the same tables without them.
 *
 * This file is structure only — routes, icons, permissions and message keys.
 * Nothing here talks to an API, and nothing here is a sentence: every visible
 * string is a key into the `console` message namespace, resolved by whichever
 * screen renders it. That keeps one list of what exists and one list of what
 * it is called, per language.
 */

export type ConsoleKind = "admin" | "moderator";

export type ConsoleConfig = {
  kind: ConsoleKind;
  base: "/admin-console" | "/moderator-console";
  /** Key for the name under the wordmark in the sidebar. */
  labelKey: string;
  /** The account role this console belongs to. */
  role: "admin" | "moderator";
  /** Key for how that role is named in the interface. */
  roleLabelKey: string;
  blurbKey: string;
  /** Which controls the screens are allowed to draw. */
  can: {
    create: boolean;
    edit: boolean;
    remove: boolean;
    manageUsers: boolean;
    /** Whether the catalogue list screen exists at all in this console. */
    browseCatalogue: boolean;
    /** Whether the accounts screen exists at all in this console. */
    viewUsers: boolean;
    /** Whether the reviews screen exists at all in this console. */
    viewReviews: boolean;
    /** Whether that screen draws edit and delete controls. */
    manageReviews: boolean;
  };
};

export const consoles: Record<ConsoleKind, ConsoleConfig> = {
  admin: {
    kind: "admin",
    base: "/admin-console",
    labelKey: "adminConsole",
    role: "admin",
    roleLabelKey: "roles.admin",
    blurbKey: "adminBlurb",
    can: {
      create: true,
      edit: true,
      remove: true,
      manageUsers: true,
      browseCatalogue: true,
      viewUsers: true,
      viewReviews: true,
      manageReviews: true,
    },
  },
  moderator: {
    kind: "moderator",
    base: "/moderator-console",
    labelKey: "moderatorConsole",
    role: "moderator",
    roleLabelKey: "roles.moderator",
    blurbKey: "moderatorBlurb",
    can: {
      create: true,
      edit: false,
      remove: false,
      manageUsers: false,
      browseCatalogue: false,
      viewUsers: false,
      viewReviews: true,
      manageReviews: false,
    },
  },
};

/* --------------------------------------------------------- navigation */

export type NavItem = {
  href: string;
  labelKey: string;
  hintKey: string;
  icon: LucideIcon;
  /** Matched exactly, so a child route does not light a sibling. */
  exact?: boolean;
};

export type NavGroup = { titleKey: string; items: NavItem[] };

export function navigationFor({ base, can }: ConsoleConfig): NavGroup[] {
  const groups: NavGroup[] = [
    {
      titleKey: "nav.insights",
      items: [
        {
          href: base,
          labelKey: "nav.overview",
          hintKey: "nav.overviewHint",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
  ];

  /* A console that can neither browse the catalogue nor read the roster has no
     Manage group to draw — the moderator's rail is Overview and one action. */
  const manage: NavItem[] = [];

  if (can.browseCatalogue) {
    manage.push({
      href: `${base}/products`,
      labelKey: "nav.products",
      hintKey: can.edit ? "nav.productsHintEdit" : "nav.productsHintBrowse",
      icon: Package,
    });
  }

  if (can.viewUsers) {
    manage.push({
      href: `${base}/users`,
      labelKey: "nav.users",
      hintKey: can.manageUsers ? "nav.usersHintManage" : "nav.usersHintRead",
      icon: Users,
    });
  }

  if (can.viewReviews) {
    manage.push({
      href: `${base}/reviews`,
      labelKey: "nav.reviews",
      hintKey: can.manageReviews ? "nav.reviewsHintManage" : "nav.reviewsHintRead",
      icon: MessageSquare,
    });
  }

  if (manage.length) {
    /* The group is named for what is actually in it. The moderator's holds
       only Reviews, so calling it "Catalogue" would describe a screen that
       console does not have. */
    const onlyReviews = manage.length === 1 && manage[0].labelKey === "nav.reviews";

    groups.push({
      titleKey: can.edit
        ? "nav.manage"
        : onlyReviews
          ? "nav.feedback"
          : "nav.catalogue",
      items: manage,
    });
  }

  if (can.create) {
    groups.push({
      titleKey: "nav.create",
      items: [
        {
          href: `${base}/products/new`,
          labelKey: "nav.newProduct",
          hintKey: "nav.newProductHint",
          icon: PlusCircle,
          exact: true,
        },
      ],
    });
  }

  return groups;
}

function matches(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * The href of the single item to light, or null.
 *
 * More than one item can match a path — /products/new sits under Products
 * and is its own entry — so the most specific match wins and the parent
 * stays quiet. Two lit items would say the reader is in two places.
 */
export function activeHrefIn(groups: NavGroup[], pathname: string) {
  return groups
    .flatMap((group) => group.items)
    .filter((item) => matches(item, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}

/* ------------------------------------------------- catalogue vocabulary */

/* The same enums the product model spells out, so a form control never
   offers a value the store does not recognise. The category values are the
   storefront's slugs, so their names come from the shared `categories`
   namespace rather than a second copy here. */
export const CATEGORIES = [
  "furniture",
  "lighting",
  "decor",
  "kitchen",
  "apparel",
  "accessories",
  "audio",
] as const;

/** Stock at or below this is flagged across the consoles. */
export const LOW_STOCK = 6;

export const BADGES = ["New", "Sale", "Bestseller"] as const;

export const COLLECTIONS = [
  { value: "featured", key: "featured" },
  { value: "new", key: "new" },
  { value: "popular", key: "popular" },
] as const;

export const PRODUCT_SORTS = [
  "newest",
  "oldest",
  "nameAsc",
  "priceDesc",
  "priceAsc",
  "stockAsc",
  "topRated",
] as const;

export const USER_SORTS = ["newest", "oldest", "nameAsc", "emailAsc", "role"] as const;

export const ROLES = [
  { value: "admin", key: "admin" },
  { value: "moderator", key: "moderator" },
  { value: "user", key: "user" },
] as const;

/** Message key for a role value; unknown values fall back to the raw string. */
export function roleLabelKey(value: string) {
  return ROLES.some((role) => role.value === value) ? `roles.${value}` : null;
}

/* --------------------------------------------------------- formatting */

/** Mirrors the slug the API expects: lowercase, words joined by hyphens. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * What to call a staff member in the console chrome.
 *
 * The account's own name, falling back to the local part of the address —
 * "ada@shop.com" reads as "ada" rather than leaving the rail showing nothing.
 * Returns null when there is nobody, so the caller supplies the translated
 * placeholder rather than this module inventing an English one.
 */
export function staffName(user: { fullname?: string | null; email?: string | null } | null) {
  if (!user) return null;
  return user.fullname?.trim() || user.email?.split("@")[0] || null;
}

/** Two letters for an avatar plate. */
export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
