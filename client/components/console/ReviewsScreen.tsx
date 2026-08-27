"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, MessageSquare, Pencil, Trash2, X } from "lucide-react";
import ConfirmDialog from "@/components/console/ConfirmDialog";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import ReadOnlyNotice from "@/components/console/Notice";
import { Table, Td, Th, Thumb, Tr } from "@/components/console/Table";
import { Pager, Toolbar } from "@/components/console/Toolbar";
import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Input, Textarea } from "@/components/ui/Field";
import Rating from "@/components/ui/Rating";
import RatingInput from "@/components/ui/RatingInput";
import { useReview } from "@/context/ReviewContext";
import { useCounts, useDates } from "@/lib/format";
import type { Review } from "@/lib/api";
import { initialsOf, type ConsoleConfig } from "@/lib/console";

const PAGE_SIZE = 10;

const SORTS = ["newest", "oldest", "ratingDesc", "ratingAsc"] as const;

const iconButton =
  "flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface hover:text-ink";

/**
 * The reviews screen, for both consoles.
 *
 * The admin console draws edit and delete controls; the moderator console
 * draws the same rows without them, because reading what shoppers say is the
 * whole of what a moderator does here. The server refuses a moderator's write
 * regardless — this decides what the screen offers, not what is permitted.
 */
export default function ReviewsScreen({ config }: { config: ConsoleConfig }) {
  const t = useTranslations("console");
  const tCommon = useTranslations("common");
  const { count: formatCount } = useCounts();
  const dates = useDates();

  const { reviews, loading, error, getReviews, updateReviewById, deleteReviewById } = useReview();

  const [search, setSearch] = useState("");
  const [stars, setStars] = useState("any");
  const [sort, setSort] = useState<string>(SORTS[0]);
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Review | null>(null);
  const [target, setTarget] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  const { manageReviews } = config.can;

  useEffect(() => {
    void getReviews();
  }, [getReviews]);

  const rows = useMemo(() => reviews ?? [], [reviews]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matched = rows.filter((row) => {
      if (
        term &&
        !`${row.user?.fullname ?? ""} ${row.user?.email ?? ""} ${row.product?.name ?? ""} ${row.title ?? ""} ${row.body}`
          .toLowerCase()
          .includes(term)
      ) {
        return false;
      }

      if (stars !== "any" && row.rating !== Number(stars)) return false;
      return true;
    });

    const byDate = (value?: string) => (value ? new Date(value).getTime() : 0);

    switch (sort) {
      case "oldest":
        return matched.sort((a, b) => byDate(a.createdAt) - byDate(b.createdAt));
      case "ratingDesc":
        return matched.sort((a, b) => b.rating - a.rating);
      case "ratingAsc":
        return matched.sort((a, b) => a.rating - b.rating);
      default:
        return matched.sort((a, b) => byDate(b.createdAt) - byDate(a.createdAt));
    }
  }, [rows, search, stars, sort]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const paged = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  /* Any change to what is being filtered starts again from the first page. */
  const narrow = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const average = useMemo(
    () => (rows.length ? rows.reduce((sum, row) => sum + row.rating, 0) / rows.length : 0),
    [rows],
  );

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editing || busy) return;

    const form = new FormData(event.currentTarget);
    const rating = Number(form.get("rating") ?? editing.rating);
    const title = String(form.get("title") ?? "").trim();
    const body = String(form.get("body") ?? "").trim();

    if (body.length < 10) {
      setWriteError("A review must be at least ten characters.");
      return;
    }

    setWriteError(null);
    setBusy(true);

    try {
      await updateReviewById(editing._id, { rating, title, body });
      setEditing(null);
    } catch (failure) {
      setWriteError(failure instanceof Error ? failure.message : "Could not save the review");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!target) return;

    setBusy(true);
    setWriteError(null);

    try {
      await deleteReviewById(target._id);
      setTarget(null);
    } catch (failure) {
      setWriteError(failure instanceof Error ? failure.message : "Could not remove the review");
    } finally {
      setBusy(false);
    }
  };

  const problem = writeError ?? error;

  return (
    <div className="space-y-8">
      <ConsoleHeader
        breadcrumb={[
          { label: t("breadcrumb.console"), href: config.base },
          { label: t("breadcrumb.reviews") },
        ]}
        title={t("reviews.title")}
        description={
          loading && !reviews
            ? t("reviews.loading")
            : rows.length === 0
              ? t("filters.noReviewsYet")
              : t("filters.reviewsSummary", {
                  total: formatCount(rows.length),
                  average: average.toFixed(1),
                })
        }
      />

      {!manageReviews && (
        <ReadOnlyNotice>{t("reviews.readOnly")}</ReadOnlyNotice>
      )}

      {problem && (
        <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {problem}
        </p>
      )}

      <div className="rounded-lg border border-line bg-canvas">
        <Toolbar
          searchPlaceholder={t("filters.searchReviews")}
          search={search}
          onSearchChange={narrow(setSearch)}
          filters={[
            {
              id: "filter-stars",
              label: t("filters.rating"),
              options: [
                { value: "any", label: t("filters.anyRating") },
                ...[5, 4, 3, 2, 1].map((n) => ({
                  value: String(n),
                  label: t("filters.starsExactly", { count: n }),
                })),
              ],
              value: stars,
              onChange: narrow(setStars),
            },
            {
              id: "filter-review-sort",
              label: t("filters.sort"),
              options: SORTS.map((key) => ({ value: key, label: t(`reviewSorts.${key}`) })),
              value: sort,
              onChange: setSort,
            },
          ]}
          meta={t("filters.reviewsMeta", {
            shown: formatCount(visible.length),
            total: formatCount(rows.length),
          })}
        />

        {loading && !reviews ? (
          <p className="flex items-center justify-center gap-2.5 px-5 py-16 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
            {t("reviews.loading")}
          </p>
        ) : visible.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              icon={<MessageSquare className="size-6" strokeWidth={1.5} aria-hidden />}
              title={rows.length ? t("filters.noMatch") : t("filters.noReviewsYet")}
              description={
                rows.length ? t("empty.widenFilters") : t("empty.noReviewsBody")
              }
            />
          </div>
        ) : (
          <Table
            head={
              <>
                <Th>{t("table.product")}</Th>
                <Th>{t("reviews.shopper")}</Th>
                <Th>{t("table.rating")}</Th>
                <Th>{t("table.review")}</Th>
                <Th>{t("reviews.written")}</Th>
                {manageReviews && <Th align="right">{t("table.actions")}</Th>}
              </>
            }
          >
            {paged.map((row) => (
              <Tr key={row._id}>
                <Td>
                  {row.product ? (
                    <span className="flex items-center gap-3">
                      <Thumb src={row.product.image} alt="" />
                      <span className="min-w-0">
                        <Link
                          href={`/product/${row.product.slug}`}
                          className="block truncate font-medium text-ink transition-colors hover:text-accent"
                        >
                          {row.product.name}
                        </Link>
                        <span className="block truncate text-xs text-ink-subtle">
                          /{row.product.slug}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-ink-subtle">{t("reviews.pieceRemoved")}</span>
                  )}
                </Td>

                <Td>
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[0.625rem] font-medium text-ink"
                    >
                      {initialsOf(row.user?.fullname ?? "?")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-ink">
                        {row.user?.fullname ?? t("reviews.accountRemoved")}
                      </span>
                      {row.user?.email && (
                        <span className="block truncate text-xs text-ink-subtle">
                          {row.user.email}
                        </span>
                      )}
                    </span>
                  </span>
                </Td>

                <Td>
                  <Rating value={row.rating} />
                </Td>

                <Td>
                  <span className="block max-w-sm">
                    {row.title && (
                      <span className="block truncate font-medium text-ink">{row.title}</span>
                    )}
                    <span className="block truncate text-xs text-ink-subtle">{row.body}</span>
                  </span>
                </Td>

                <Td>
                  <span className="whitespace-nowrap text-xs text-ink-subtle">
                    {dates.short(row.createdAt)}
                  </span>
                </Td>

                {manageReviews && (
                  <Td align="right">
                    <span className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setWriteError(null);
                          setEditing(row);
                        }}
                        aria-label={`Edit the review by ${row.user?.fullname ?? "this shopper"}`}
                        className={iconButton}
                      >
                        <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWriteError(null);
                          setTarget(row);
                        }}
                        aria-label={`Remove the review by ${row.user?.fullname ?? "this shopper"}`}
                        className={`${iconButton} hover:bg-danger/10 hover:text-danger`}
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                      </button>
                    </span>
                  </Td>
                )}
              </Tr>
            ))}
          </Table>
        )}

        <Pager page={current} pages={pages} onChange={setPage} />
      </div>

      {/* ------------------------------------------------- the editor */}
      {editing && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={tCommon("cancel")}
            onClick={() => setEditing(null)}
            className="absolute inset-0 bg-feature/50 backdrop-blur-[2px]"
          />

          <form
            onSubmit={onSave}
            noValidate
            role="dialog"
            aria-modal="true"
            aria-label={t("reviews.editReview")}
            className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-canvas p-6 shadow-pop"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-xl tracking-tight text-ink">
                  {t("reviews.editReview")}
                </h2>
                <p className="mt-1 truncate text-xs text-ink-subtle">
                  {t("reviews.byOn", {
                    name: editing.user?.fullname ?? t("reviews.accountRemoved"),
                    product: editing.product?.name ?? t("reviews.removedPiece"),
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label={tCommon("close")}
                className={iconButton}
              >
                <X className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <div className="mt-5">
              <RatingInput defaultValue={editing.rating} disabled={busy} />
            </div>

            <Input
              id="console-review-title"
              name="title"
              label={t("reviews.headline")}
              defaultValue={editing.title ?? ""}
              disabled={busy}
              className="mt-5"
            />

            <Textarea
              id="console-review-body"
              name="body"
              label={t("reviews.review")}
              rows={6}
              defaultValue={editing.body}
              disabled={busy}
              className="mt-5"
              required
            />

            <p className="mt-4 flex items-start gap-2.5 rounded-md bg-surface px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
              <AlertCircle className="mt-px size-4 shrink-0 text-warning" strokeWidth={1.75} aria-hidden />
              {t("reviews.editWarning")}
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setEditing(null)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
                    {tCommon("saving")}
                  </>
                ) : (
                  t("reviews.saveReview")
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title={t("reviews.confirmRemoveTitle")}
        body={t("reviews.confirmRemoveBody", {
          name: target?.user?.fullname ?? t("reviews.thisShopper"),
        })}
        confirmLabel={t("reviews.confirmRemoveAction")}
        busy={busy}
        onConfirm={onDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
