"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const iconAction =
  "flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface";

/**
 * The saved-list and bag links, with counts read from the signed-in account.
 *
 * Both badges stay hidden until the account has loaded, so the header never
 * flashes a zero at somebody who does have things in their bag.
 */
export default function HeaderActions() {
  const t = useTranslations("header");
  const { user, loading, cartCount } = useAuth();

  const savedCount = user?.favoriteProducts?.length ?? 0;
  const showCounts = !loading && Boolean(user);

  return (
    <>
      <Link
        href="/wishlist"
        aria-label={
          showCounts ? t("wishlistWithCount", { count: savedCount }) : t("wishlist")
        }
        className={`${iconAction} relative hidden sm:flex`}
      >
        <Heart className="size-5" strokeWidth={1.75} aria-hidden />
        {showCounts && <Count value={savedCount} />}
      </Link>

      <Link
        href="/cart"
        aria-label={showCounts ? t("bagWithCount", { count: cartCount }) : t("bag")}
        className={`${iconAction} relative`}
      >
        <ShoppingBag className="size-5" strokeWidth={1.75} aria-hidden />
        {showCounts && <Count value={cartCount} />}
      </Link>
    </>
  );
}

function Count({ value }: { value: number }) {
  if (value === 0) return null;

  return (
    <span
      className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-medium leading-4 text-canvas"
      aria-hidden
    >
      {value}
    </span>
  );
}
