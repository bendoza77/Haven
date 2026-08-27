"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "h-10 rounded-md border border-line-strong bg-canvas px-3 text-sm text-ink transition-colors hover:border-ink-subtle focus:border-ink focus:outline-none";

/**
 * A filter. Hand it `value` and `onChange` to drive a live table; leave them
 * off and the control keeps its own state, which is all a screen still on
 * mock data needs.
 */
export type FilterOption = {
  /* Stable and language-independent: the screens compare against this, so a
     table filtered in English stays filtered after a switch to Georgian. */
  value: string;
  /** What the reader sees. */
  label: string;
};

export type Filter = {
  id: string;
  label: string;
  options: readonly FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
};

/**
 * The band above a table: one search field, the filters that narrow it, and
 * the count of what survived.
 */
export function Toolbar({
  searchPlaceholder,
  search,
  onSearchChange,
  filters,
  meta,
}: {
  searchPlaceholder: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  filters: Filter[];
  meta: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-xs">
        <label htmlFor="toolbar-search" className="sr-only">
          {searchPlaceholder}
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <input
          id="toolbar-search"
          type="search"
          placeholder={searchPlaceholder}
          {...(onSearchChange
            ? { value: search ?? "", onChange: (event) => onSearchChange(event.target.value) }
            : {})}
          className={cn(control, "w-full pl-9")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal
          className="hidden size-4 text-ink-subtle lg:block"
          strokeWidth={1.75}
          aria-hidden
        />

        {filters.map((filter) => (
          <div key={filter.id}>
            <label htmlFor={filter.id} className="sr-only">
              {filter.label}
            </label>
            <select
              id={filter.id}
              {...(filter.onChange
                ? {
                    value: filter.value ?? filter.options[0].value,
                    onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
                      filter.onChange?.(event.target.value),
                  }
                : { defaultValue: filter.options[0].value })}
              className={cn(control, "pr-8")}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-subtle lg:ml-auto lg:shrink-0">{meta}</p>
    </div>
  );
}

const step =
  "flex size-9 items-center justify-center rounded-md border border-line text-ink transition-colors hover:border-ink";

/** Previous/next arrow — a button while there is somewhere to go, else inert. */
function Step({
  to,
  pages,
  label,
  onChange,
  children,
}: {
  to: number;
  pages: number;
  label: string;
  onChange?: (page: number) => void;
  children: React.ReactNode;
}) {
  if (!onChange || to < 1 || to > pages) {
    return (
      <span className={cn(step, "cursor-not-allowed text-line-strong")} aria-hidden>
        {children}
      </span>
    );
  }

  return (
    <button type="button" onClick={() => onChange(to)} aria-label={label} className={step}>
      {children}
    </button>
  );
}

/** Table footer paging. Without `onChange` the pages are drawn but inert. */
export function Pager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange?: (page: number) => void;
}) {
  const t = useTranslations("console.toolbar");
  const numbers = Array.from({ length: pages }, (_, index) => index + 1);

  return (
    <nav
      aria-label={t("pagination")}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3"
    >
      <p className="text-xs text-ink-subtle">
        {t("pageOf", { page, pages })}
      </p>

      <div className="flex items-center gap-1.5">
        <Step to={page - 1} pages={pages} label={t("previousPage")} onChange={onChange}>
          <ChevronLeft className="size-4" />
        </Step>

        {numbers.map((number) => {
          const classes = cn(
            "flex size-9 items-center justify-center rounded-md border text-sm transition-colors",
            number === page
              ? "border-ink bg-ink text-canvas"
              : "border-line text-ink-muted hover:border-ink hover:text-ink",
          );

          return onChange ? (
            <button
              key={number}
              type="button"
              onClick={() => onChange(number)}
              aria-current={number === page ? "page" : undefined}
              className={classes}
            >
              {number}
            </button>
          ) : (
            <span
              key={number}
              aria-current={number === page ? "page" : undefined}
              className={classes}
            >
              {number}
            </span>
          );
        })}

        <Step to={page + 1} pages={pages} label={t("nextPage")} onChange={onChange}>
          <ChevronRight className="size-4" />
        </Step>
      </div>
    </nav>
  );
}
