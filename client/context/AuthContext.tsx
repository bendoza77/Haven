"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, type Account } from "@/lib/api";

/**
 * The signed-in shopper, and everything hanging off them.
 *
 * The bag and the saved list live on the account in MongoDB, and every write
 * here answers with the whole account — so one round trip both saves the
 * change and refreshes what the header, the wishlist and the bag are drawing.
 * There is no second copy of this state anywhere.
 */
type AuthContextValue = {
  user: Account | null;
  loading: boolean;
  /**
   * Signs in, or reports that a code is needed first.
   *
   * A two-step account gets no session from a correct password, so callers
   * must branch on `twoFactorRequired` rather than assume they are signed in.
   */
  login: (email: string, password: string) => Promise<{ twoFactorRequired: boolean }>;
  /** Finishes a two-step sign-in with the emailed code. */
  verifyTwoFactor: (email: string, code: string) => Promise<void>;
  signup: (fullname: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Adopts an account handed back by a verify or reset link. */
  adopt: (account: Account) => void;

  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;

  cartCount: number;
  addToCart: (payload: {
    productId: string;
    quantity?: number;
    size?: string;
    color?: string;
  }) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* -------------------------------------------------------- the session, once
 *
 * These three live on the module rather than in the provider, and that is the
 * whole point. The provider is mounted by app/[locale]/layout.tsx, so the
 * `[locale]` segment is part of its position in the route tree: switching
 * language changes that segment, React unmounts the subtree and mounts a new
 * one, and — with the fetch inside the component — that meant a fresh
 * GET /auth/auto-login on every switch. That is the request that appeared in
 * the console each time, and the reason the header flashed its skeleton and
 * redrew the sign-in controls before settling back to the shopper's name. Any
 * other remount did the same: an error boundary resetting, a move between the
 * shop and a console.
 *
 * `settled` is what a remount reads — the answer is already here, so there is
 * nothing to load and nothing to ask for. `inFlight` covers the other case:
 * two providers mounting while the first request is still open share the one
 * promise rather than opening a second connection.
 *
 * The session itself is an httpOnly cookie and survives a real page load on
 * its own. This cache only has to survive React unmounting a subtree, which is
 * exactly the lifetime of the module.
 */
let cachedAccount: Account | null = null;
let settled = false;
let inFlight: Promise<Account | null> | null = null;

function remember(account: Account | null) {
  cachedAccount = account;
  settled = true;
  return account;
}

/**
 * The account behind the session cookie, fetched at most once per page load.
 *
 * A 401 is the ordinary answer for a visitor who is not signed in, so this
 * resolves to `null` rather than rejecting — "nobody is signed in" is a
 * result, not a failure, and every caller wants the same thing from it.
 */
function loadAccount(force = false): Promise<Account | null> {
  if (force) {
    settled = false;
    inFlight = null;
  }

  if (settled) return Promise.resolve(cachedAccount);

  inFlight ??= api
    .autoLogin()
    .then((response) => remember(response.data))
    .catch(() => remember(null))
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  /* Seeded from the module cache, so a remount paints the signed-in header on
     its first frame instead of a skeleton. */
  const [user, setUser] = useState<Account | null>(() => cachedAccount);
  const [loading, setLoading] = useState(() => !settled);

  const setAccount = useCallback((account: Account | null) => {
    remember(account);
    setUser(account);
  }, []);

  useEffect(() => {
    let cancelled = false;

    /* When the answer is already cached this resolves on the next microtask
       with the same values the state was seeded with, so React bails out and
       nothing repaints — and, the part that matters, nothing is fetched. That
       is the path a language switch takes. */
    loadAccount().then((account) => {
      if (cancelled) return;
      setUser(account);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.login(email, password);

      /* No session yet — the caller collects the code and calls
         verifyTwoFactor. Writing the half-account here would sign somebody in
         on a password. */
      if (response.twoFactorRequired) {
        return { twoFactorRequired: true };
      }

      setAccount(response.data);
      return { twoFactorRequired: false };
    },
    [setAccount],
  );

  const verifyTwoFactor = useCallback(
    async (email: string, code: string) => {
      const response = await api.verifyTwoFactor(email, code);
      setAccount(response.data);
    },
    [setAccount],
  );

  /**
   * Creates the account only. No session starts here — the shopper is signed
   * in when they follow the link in the confirmation email, which is what
   * proves the address is theirs.
   */
  const signup = useCallback(async (fullname: string, email: string, password: string) => {
    await api.signup(fullname, email, password);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setAccount(null);
  }, [setAccount]);

  /** Re-reads the account from the API, past the once-per-load cache. */
  const refresh = useCallback(async () => {
    setUser(await loadAccount(true));
  }, []);

  const adopt = useCallback((account: Account) => setAccount(account), [setAccount]);

  const isFavorite = useCallback(
    (productId: string) =>
      Boolean(user?.favoriteProducts?.some((product) => product._id === productId)),
    [user],
  );

  /* Every mutation below is guarded on being signed in: the bag belongs to an
     account, so there is nothing to write to without one. Callers check first
     and send people to sign in — this is the backstop. */
  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) throw new Error("Sign in to do that");

      const response = isFavorite(productId)
        ? await api.account.removeFavorite(productId)
        : await api.account.addFavorite(productId);

      setAccount(response.data);
    },
    [user, isFavorite, setAccount],
  );

  const addToCart: AuthContextValue["addToCart"] = useCallback(
    async (payload) => {
      if (!user) throw new Error("Sign in to do that");

      const response = await api.account.addToCart(payload);
      setAccount(response.data);
    },
    [user, setAccount],
  );

  const updateCartItem = useCallback(
    async (itemId: string, quantity: number) => {
      const response = await api.account.updateCartItem(itemId, quantity);
      setAccount(response.data);
    },
    [setAccount],
  );

  const removeCartItem = useCallback(
    async (itemId: string) => {
      const response = await api.account.removeCartItem(itemId);
      setAccount(response.data);
    },
    [setAccount],
  );

  const clearCart = useCallback(async () => {
    const response = await api.account.clearCart();
    setAccount(response.data);
  }, [setAccount]);

  const cartCount = useMemo(
    () => user?.cart?.reduce((count, line) => count + line.quantity, 0) ?? 0,
    [user],
  );

  /**
   * Memoised, because this context is read by the header on every page.
   *
   * Rebuilt on each render, the value object had a new identity every time and
   * every consumer of `useAuth` re-rendered with it — the bag badge, the saved
   * count, the sign-in controls, each product card's save button — whether or
   * not the account had changed.
   */
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      verifyTwoFactor,
      signup,
      logout,
      refresh,
      adopt,
      isFavorite,
      toggleFavorite,
      cartCount,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
    }),
    [
      user,
      loading,
      login,
      verifyTwoFactor,
      signup,
      logout,
      refresh,
      adopt,
      isFavorite,
      toggleFavorite,
      cartCount,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
