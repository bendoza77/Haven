"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-url";
import type { User } from "@/lib/api";

/**
 * Account CRUD for the admin console.
 *
 * Every call goes to /api/users, which sits behind `protect` and
 * `allowed("admin")` on the server — so the browser holding this state is
 * never what decides who may write. This is the screen's copy of the roster
 * and nothing more: the list is patched in place after each mutation so a
 * table does not have to be refetched to show what just changed.
 */

export type UserInput = {
  fullname?: string;
  email?: string;
  password?: string;
  role?: User["role"];
  isVerifed?: boolean;
};

type UserContextValue = {
  users: User[] | null;
  user: User | null;
  /** True while any of the calls below is in flight. */
  loading: boolean;
  /** The last failure, in words worth showing. Cleared by the next attempt. */
  error: string | null;
  getUsers: () => Promise<void>;
  getUserById: (id: string) => Promise<void>;
  createUser: (input: UserInput) => Promise<User>;
  updateUserById: (id: string, input: UserInput) => Promise<User>;
  deleteUserById: (id: string) => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

/**
 * One fetch for all five calls.
 *
 * `credentials: "include"` is the load-bearing part: the session is the httpOnly
 * `hv` cookie, and without this the browser sends nothing and every call comes
 * back 401 no matter who is signed in.
 */
async function send<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...options,
    credentials: "include",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
  });

  /* An error page from a proxy is not JSON, so a parse failure must not be
     reported as though the API said something. */
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }

  return body as T;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Every call shares this shape: clear the last error, run, record a failure
     in state AND rethrow it so a form can keep the reader on the page. */
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

  const getUsers = useCallback(
    () =>
      run(async () => {
        const body = await send<{ data: User[] }>("/users");
        setUsers(body.data);
      }),
    [run],
  );

  const getUserById = useCallback(
    (id: string) =>
      run(async () => {
        const body = await send<{ data: User }>(`/users/${id}`);
        setUser(body.data);
      }),
    [run],
  );

  const createUser = useCallback(
    (input: UserInput) =>
      run(async () => {
        const body = await send<{ data: User }>("/users", {
          method: "POST",
          body: JSON.stringify(input),
        });

        setUsers((current) => (current ? [body.data, ...current] : [body.data]));

        return body.data;
      }),
    [run],
  );

  const updateUserById = useCallback(
    (id: string, input: UserInput) =>
      run(async () => {
        const body = await send<{ data: User }>(`/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });

        /* Matched on _id — the API's own key. `id` is a Mongoose convenience
           that does not survive JSON, so it is undefined on every row here. */
        setUsers((current) =>
          current?.map((row) => (row._id === id ? body.data : row)) ?? null,
        );
        setUser((current) => (current?._id === id ? body.data : current));

        return body.data;
      }),
    [run],
  );

  const deleteUserById = useCallback(
    (id: string) =>
      run(async () => {
        await send<{ message: string }>(`/users/${id}`, { method: "DELETE" });

        setUsers((current) => current?.filter((row) => row._id !== id) ?? null);
        setUser((current) => (current?._id === id ? null : current));
      }),
    [run],
  );

  const value = useMemo(
    () => ({
      users,
      user,
      loading,
      error,
      getUsers,
      getUserById,
      createUser,
      updateUserById,
      deleteUserById,
    }),
    [users, user, loading, error, getUsers, getUserById, createUser, updateUserById, deleteUserById],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return context;
}
