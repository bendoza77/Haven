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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .autoLogin()
      .then((response) => {
        if (!cancelled) setUser(response.data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);

    /* No session yet — the caller collects the code and calls verifyTwoFactor.
       Writing the half-account here would sign somebody in on a password. */
    if (response.twoFactorRequired) {
      return { twoFactorRequired: true };
    }

    setUser(response.data);
    return { twoFactorRequired: false };
  }, []);

  const verifyTwoFactor = useCallback(async (email: string, code: string) => {
    const response = await api.verifyTwoFactor(email, code);
    setUser(response.data);
  }, []);

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
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await api.account.me();
      setUser(response.data);
    } catch {
      setUser(null);
    }
  }, []);

  const adopt = useCallback((account: Account) => setUser(account), []);

  /* Every mutation below is guarded on being signed in: the bag belongs to an
     account, so there is nothing to write to without one. Callers check first
     and send people to sign in — this is the backstop. */
  const requireUser = () => {
    if (!user) throw new Error("Sign in to do that");
  };

  const isFavorite = useCallback(
    (productId: string) =>
      Boolean(user?.favoriteProducts?.some((product) => product._id === productId)),
    [user],
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      requireUser();

      const response = isFavorite(productId)
        ? await api.account.removeFavorite(productId)
        : await api.account.addFavorite(productId);

      setUser(response.data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isFavorite],
  );

  const addToCart: AuthContextValue["addToCart"] = useCallback(
    async (payload) => {
      requireUser();
      const response = await api.account.addToCart(payload);
      setUser(response.data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    const response = await api.account.updateCartItem(itemId, quantity);
    setUser(response.data);
  }, []);

  const removeCartItem = useCallback(async (itemId: string) => {
    const response = await api.account.removeCartItem(itemId);
    setUser(response.data);
  }, []);

  const clearCart = useCallback(async () => {
    const response = await api.account.clearCart();
    setUser(response.data);
  }, []);

  const cartCount = useMemo(
    () => user?.cart?.reduce((count, line) => count + line.quantity, 0) ?? 0,
    [user],
  );

  const value: AuthContextValue = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
