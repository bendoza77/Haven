"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, MessageSquare, Pencil, Star, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/console/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import Rating from "@/components/ui/Rating";
import RatingInput from "@/components/ui/RatingInput";
import { useAuth } from "@/context/AuthContext";
import { api, type Review } from "@/lib/api";
import { initialsOf } from "@/lib/console";
import { useDates } from "@/lib/format";

/**
 * Reviews on a product page: what people said, and the form to say something.
 *
 * Read openly by anyone; written only by a signed-in shopper, once per piece —
 * the server enforces both, and the form here reflects that rather than
 * deciding it. Somebody who has already written sees their own review in the
 * editor instead of a second empty form.
 */
export default function ProductReviews({
  slug,
  productName,
  initialReviews,
}: {
  slug: string;
  productName: string;
  /**
   * What the server already read, so the list is in the HTML.
   *
   * This component used to fetch on mount, which meant three things had to
   * happen before a single review appeared: the bundle downloaded, React
   * hydrated, and a request went to the API and came back. A crawler saw none
   * of it, and neither did a reader for the first second or two of a page
   * whose whole purpose is to help them decide. The server has the list by the
   * time it writes the markup — see fetchReviews in lib/products.ts — so it
   * comes down with the page and the effect below is only a re-read.
   */
  initialReviews: Review[];
}) {
  const t = useTranslations("reviews");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  /* Only ever true when the server had nothing to give — an API that was
     unreachable during the render. With a seeded list there is nothing to
     wait for and no spinner to show. */
  const [loading, setLoading] = useState(initialReviews.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);

  /* Re-read after a write. The first read is the effect below, which owns its
     own cancellation — this one is only ever called from an event handler. */
  const load = useCallback(async () => {
    try {
      const response = await api.products.reviews(slug);
      setReviews(response.data);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("couldNotLoad"));
    }
  }, [slug, t]);

  useEffect(() => {
    /* The server's copy is a cached read, up to a minute old. That is right for
       the markup and wrong for somebody who has just written a review, so this
       only runs when there was nothing to seed with — otherwise the list is
       re-read by `load` after a write, which is the moment it can be stale. */
    if (initialReviews.length > 0) return;

    let cancelled = false;

    api.products
      .reviews(slug)
      .then((response) => {
        if (!cancelled) setReviews(response.data);
      })
      .catch((failure: unknown) => {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : "Could not load the reviews");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, initialReviews.length]);

  /* The signed-in shopper's own review, if they have written one. It is drawn
     apart from the others so it can carry the edit and delete controls. */
  const mine = useMemo(
    () => (user ? reviews.find((review) => review.user?._id === user._id) ?? null : null),
    [reviews, user],
  );

  const others = useMemo(
    () => reviews.filter((review) => review._id !== mine?._id),
    [reviews, mine],
  );

  const summary = useMemo(() => {
    if (reviews.length === 0) return { average: 0, spread: [] as { stars: number; count: number }[] };

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);

    return {
      average: total / reviews.length,
      spread: [5, 4, 3, 2, 1].map((starCount) => ({
        stars: starCount,
        count: reviews.filter((review) => review.rating === starCount).length,
      })),
    };
  }, [reviews]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) return;

    const form = new FormData(event.currentTarget);
    const rating = Number(form.get("rating") ?? 0);
    const title = String(form.get("title") ?? "").trim();
    const body = String(form.get("body") ?? "").trim();

    if (!rating) {
      setFormError(t("pickRating"));
      return;
    }

    if (body.length < 10) {
      setFormError(t("tooShort"));
      return;
    }

    setFormError(null);
    setBusy(true);

    try {
      if (mine) {
        await api.reviews.update(mine._id, { rating, title, body });
        setEditing(false);
      } else {
        await api.products.addReview(slug, { rating, title, body });
      }

      /* Refetched rather than patched in: the server owns the published shape,
         and a re-read is one request against a list this short. */
      await load();
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : t("couldNotPublish"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!mine) return;

    setBusy(true);

    try {
      await api.reviews.remove(mine._id);
      setRemoving(false);
      setEditing(false);
      await load();
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : t("couldNotRemove"));
    } finally {
      setBusy(false);
    }
  };

  const writing = !mine || editing;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
      {/* ------------------------------------------------- the summary */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="font-display text-3xl leading-tight tracking-tight text-ink">
          {t("heading")}
        </h2>

        {loading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
            {t("loading")}
          </p>
        ) : reviews.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            {t("nobodyYet", { name: productName })}
          </p>
        ) : (
          <>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-5xl leading-none tracking-tight text-ink">
                {summary.average.toFixed(1)}
              </span>
              <span className="text-sm text-ink-subtle">{t("outOf5")}</span>
            </div>

            <div className="mt-3">
              <Rating value={summary.average} />
            </div>

            <p className="mt-2 text-sm text-ink-muted">
              {t("count", { count: reviews.length })}
            </p>

            <ul className="mt-6 space-y-2">
              {summary.spread.map(({ stars, count }) => (
                <li key={stars} className="flex items-center gap-3 text-xs text-ink-muted">
                  <span className="flex w-10 shrink-0 items-center gap-1 tabular-nums">
                    {stars}
                    <Star className="size-3 fill-ink text-ink" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-strong">
                    <span
                      className="block h-full rounded-full bg-ink"
                      style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* ------------------------------------------------ write + list */}
      <div className="min-w-0">
        {/* The form, or the reason there isn't one. */}
        {!user ? (
          <div className="rounded-lg border border-line bg-surface px-5 py-6">
            <p className="text-sm leading-relaxed text-ink-muted">
              <Link href="/login" className="font-medium text-ink underline underline-offset-4">
                {tAuth("signIn")}
              </Link>{" "}
              {t("signInPrompt")}
            </p>
          </div>
        ) : writing ? (
          <form onSubmit={onSubmit} noValidate className="rounded-lg border border-line bg-surface p-5 sm:p-6">
            <h3 className="font-display text-xl leading-tight tracking-tight text-ink">
              {mine ? t("editYours") : t("reviewNamed", { name: productName })}
            </h3>

            <div className="mt-5">
              <RatingInput defaultValue={mine?.rating ?? 0} disabled={busy} />
            </div>

            <Input
              id="review-title"
              name="title"
              label={t("headline")}
              placeholder={t("headlinePlaceholder")}
              defaultValue={mine?.title ?? ""}
              disabled={busy}
              className="mt-5"
            />

            <Textarea
              id="review-body"
              name="body"
              label={t("yourReview")}
              rows={5}
              placeholder={t("bodyPlaceholder")}
              defaultValue={mine?.body ?? ""}
              disabled={busy}
              className="mt-5"
              required
            />

            <p role="alert" aria-live="polite" className="sr-only">
              {formError ?? ""}
            </p>

            {formError && (
              <p className="mt-4 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-3 text-xs leading-relaxed text-ink">
                <AlertCircle className="mt-px size-4 shrink-0 text-danger" strokeWidth={1.75} aria-hidden />
                {formError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
                    {t("publishing")}
                  </>
                ) : mine ? (
                  tCommon("saveChanges")
                ) : (
                  t("publish")
                )}
              </Button>

              {mine && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false);
                    setFormError(null);
                  }}
                >
                  {tCommon("cancel")}
                </Button>
              )}
            </div>
          </form>
        ) : (
          <ReviewCard
            review={mine}
            own
            onEdit={() => setEditing(true)}
            onDelete={() => setRemoving(true)}
          />
        )}

        {error && (
          <p className="mt-6 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        )}

        {others.length > 0 && (
          <ul className="mt-8 space-y-4">
            {others.map((review) => (
              <li key={review._id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        )}

        {!loading && reviews.length === 0 && user && (
          <p className="mt-8 flex items-center gap-2.5 text-sm text-ink-subtle">
            <MessageSquare className="size-4" strokeWidth={1.75} aria-hidden />
            {t("beFirst")}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={removing}
        title={t("confirmTitle")}
        body={t("confirmBody", { name: productName })}
        confirmLabel={t("confirmAction")}
        busy={busy}
        onConfirm={onDelete}
        onCancel={() => setRemoving(false)}
      />
    </div>
  );
}

const iconButton =
  "flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface hover:text-ink";

function ReviewCard({
  review,
  own,
  onEdit,
  onDelete,
}: {
  review: Review;
  own?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations("reviews");
  const dates = useDates();

  const name = review.user?.fullname ?? t("someone");

  return (
    <article
      className={`rounded-lg border px-5 py-5 ${own ? "border-ink/20 bg-surface" : "border-line bg-canvas"}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-xs font-medium text-ink"
        >
          {initialsOf(name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-ink">{name}</span>
            {own && (
              <span className="rounded-sm bg-ink px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-canvas">
                {t("you")}
              </span>
            )}
            <span className="text-xs text-ink-subtle">{dates.long(review.createdAt)}</span>
          </div>

          <div className="mt-1.5">
            <Rating value={review.rating} />
          </div>
        </div>

        {own && (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onEdit} aria-label={t("editAction")} className={iconButton}>
              <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={t("removeAction")}
              className={`${iconButton} hover:bg-danger/10 hover:text-danger`}
            >
              <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        )}
      </div>

      {review.title && (
        <h4 className="mt-4 font-medium leading-snug text-ink">{review.title}</h4>
      )}

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
        {review.body}
      </p>
    </article>
  );
}
