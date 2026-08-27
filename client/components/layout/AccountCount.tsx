"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

/**
 * The "3 items" line in a page header. Reads the signed-in account, so it
 * says nothing at all until there is one — a count of zero for a visitor who
 * simply has not signed in yet would be a lie.
 */
export default function AccountCount({ of }: { of: "cart" | "wishlist" }) {
  const t = useTranslations("counts");
  const { user, loading, cartCount } = useAuth();

  if (loading || !user) return null;

  if (of === "wishlist") {
    const saved = user.favoriteProducts?.length ?? 0;
    return <>{t("saved", { count: saved })}</>;
  }

  // Pluralised through ICU rather than a ternary: Georgian does not split
  // one from many the way English does, and the rule belongs in the message.
  return <>{t("items", { count: cartCount })}</>;
}
