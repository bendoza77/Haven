"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Account } from "@/lib/api";

/**
 * The staff session.
 *
 * Backed by the store's own accounts rather than a separate identity system,
 * because the thing that decides who may open a console — the role — lives on
 * those accounts and nowhere else. A correct password is therefore not enough:
 * `staff` is null for a signed-in customer, and the guard shows them the door
 * rather than the console.
 *
 * It also means one session covers both halves of the job. The screens read
 * and write through the same cookie the API authorises on, so a console that
 * shows you a table can also be trusted to save what you change in it.
 */
const STAFF_ROLES = ["admin", "moderator"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const isStaff = (user: Account | null): boolean =>
  Boolean(user && (STAFF_ROLES as readonly string[]).includes(user.role));

type ConsoleAuthValue = {
  /** The signed-in account, but only when its role may open a console. */
  staff: Account | null;
  /** Whoever is signed in, staff or not — the guard needs to tell the two apart. */
  account: Account | null;
  loading: boolean;
  signOutStaff: () => Promise<void>;
};

const ConsoleAuthContext = createContext<ConsoleAuthValue | null>(null);

export function ConsoleAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  const signOutStaff = useCallback(async () => {
    await logout();
  }, [logout]);

  const value = useMemo(
    () => ({
      staff: isStaff(user) ? user : null,
      account: user,
      loading,
      signOutStaff,
    }),
    [user, loading, signOutStaff],
  );

  return <ConsoleAuthContext.Provider value={value}>{children}</ConsoleAuthContext.Provider>;
}

export function useConsoleAuth() {
  const context = useContext(ConsoleAuthContext);

  if (!context) {
    throw new Error("useConsoleAuth must be used inside ConsoleAuthProvider");
  }

  return context;
}
