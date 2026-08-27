"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2 } from "lucide-react";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import { StatusPill } from "@/components/console/Pills";
import ProductForm from "@/components/console/ProductForm";
import { ButtonLink } from "@/components/ui/Button";
import { api, type Product } from "@/lib/api";
import { useCounts } from "@/lib/format";
import type { ConsoleConfig } from "@/lib/console";

/** Loads one product by id and hands it to the editor. */
export default function ProductEditor({ config, id }: { config: ConsoleConfig; id: string }) {
  const t = useTranslations("console");
  const { money } = useCounts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api.products
      .get(id)
      .then((response) => {
        if (!cancelled) setProduct(response.data);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load the product");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2.5 rounded-lg border border-line bg-canvas px-4 py-20 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
        {t("products.loadingProduct")}
      </p>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-8">
        <ConsoleHeader
          breadcrumb={[
            { label: t("breadcrumb.console"), href: config.base },
            { label: t("breadcrumb.products"), href: `${config.base}/products` },
            { label: t("breadcrumb.notFound") },
          ]}
          title={t("products.notFoundTitle")}
          description={t("products.notFoundBody")}
          actions={
            <ButtonLink href={`${config.base}/products`} variant="secondary">
              {t("products.backToProducts")}
            </ButtonLink>
          }
        />
        {error && (
          <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ConsoleHeader
        breadcrumb={[
          { label: t("breadcrumb.console"), href: config.base },
          { label: t("breadcrumb.products"), href: `${config.base}/products` },
          { label: product.name },
        ]}
        title={product.name}
        description={`${money(product.price)} · ${t("products.inStock", { count: product.stock })}`}
        actions={
          <>
            <span className="mr-1 flex items-center">
              <StatusPill active={product.isActive} />
            </span>
            <ButtonLink href={`/product/${product.slug}`} variant="secondary">
              {t("products.viewInShop")}
            </ButtonLink>
          </>
        }
      />

      <ProductForm config={config} product={product} submitLabel={t("actions.saveChanges")} />
    </div>
  );
}
