"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api, type Review, type ReviewInput } from "@/lib/api";

/**
 * Review CRUD for the consoles.
 *
 * Shaped like UserContext next door, for the same reason: the screens hold one
 * copy of the roster and patch it in place after each write, so a table never
 * has to be refetched to show what just changed.
 *
 * The storefront does not use this — a product page reads its own reviews
 * through `api.products.reviews`, because it wants one piece's worth and not
 * the whole store's.
 */
type ReviewContextValue = {
  reviews: Review[] | null;
  loading: boolean;
  error: string | null;
  getReviews: () => Promise<void>;
  updateReviewById: (id: string, input: Partial<ReviewInput>) => Promise<Review>;
  deleteReviewById: (id: string) => Promise<void>;
};

const ReviewContext = createContext<ReviewContextValue | null>(null);

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Clear the last error, run, record a failure in state AND rethrow it so a
     caller can keep the reader on the page. */
  const run = useCallback(async <T,>(work: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      return await work();
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Something went wrong";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getReviews = useCallback(
    () =>
      run(async () => {
        const response = await api.reviews.list();
        setReviews(response.data);
      }),
    [run],
  );

  const updateReviewById = useCallback(
    (id: string, input: Partial<ReviewInput>) =>
      run(async () => {
        const response = await api.reviews.update(id, input);

        setReviews((current) =>
          current?.map((row) => (row._id === id ? response.data : row)) ?? null,
        );

        return response.data;
      }),
    [run],
  );

  const deleteReviewById = useCallback(
    (id: string) =>
      run(async () => {
        await api.reviews.remove(id);
        setReviews((current) => current?.filter((row) => row._id !== id) ?? null);
      }),
    [run],
  );

  const value = useMemo(
    () => ({ reviews, loading, error, getReviews, updateReviewById, deleteReviewById }),
    [reviews, loading, error, getReviews, updateReviewById, deleteReviewById],
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview() {
  const context = useContext(ReviewContext);

  if (!context) {
    throw new Error("useReview must be used inside ReviewProvider");
  }

  return context;
}
