"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import ConfirmDialog from "@/components/console/ConfirmDialog";
import ConsoleHeader from "@/components/console/ConsoleHeader";
import { RolePill, VerifiedPill } from "@/components/console/Pills";
import { Table, Td, Th, Tr } from "@/components/console/Table";
import { Pager, Toolbar } from "@/components/console/Toolbar";
import { ButtonLink } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useUser } from "@/context/UserContext";
import { useCounts, useDates } from "@/lib/format";
import type { User } from "@/lib/api";
import {
  initialsOf,
  ROLES,
  USER_SORTS,
  type ConsoleConfig,
} from "@/lib/console";

const PAGE_SIZE = 10;

const iconButton =
  "flex size-8 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface hover:text-ink";

/**
 * The accounts screen — admin only.
 *
 * Every row is a real account read from /api/users. The API answers with the
 * whole roster in one call, so searching, filtering and paging happen here
 * against that array and the toolbar responds on the keystroke.
 *
 * There are no Orders or Spent columns: this store has no order model, so
 * there is nothing behind those numbers to show.
 */
export default function UsersScreen({ config }: { config: ConsoleConfig }) {
  const t = useTranslations("console");
  const locale = useLocale();
  const { count: formatCount } = useCounts();
  const dates = useDates();

  const { users, loading, error, getUsers, deleteUserById } = useUser();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [provider, setProvider] = useState("any");
  const [state, setState] = useState("any");
  const [sort, setSort] = useState<string>(USER_SORTS[0]);
  const [page, setPage] = useState(1);

  const [target, setTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void getUsers();
  }, [getUsers]);

  /* Memoised so the empty-array fallback is not a new reference every render,
     which would defeat the filtering memo below. */
  const rows = useMemo(() => users ?? [], [users]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matched = rows.filter((row) => {
      if (term && !`${row.fullname} ${row.email}`.toLowerCase().includes(term)) return false;
      if (role !== "all" && row.role !== role) return false;
      if (provider === "local" && row.provider !== "local") return false;
      if (provider === "google" && row.provider !== "google") return false;
      if (state === "verified" && !row.isVerifed) return false;
      if (state === "pending" && row.isVerifed) return false;
      return true;
    });

    const byDate = (value?: string) => (value ? new Date(value).getTime() : 0);

    switch (sort) {
      case "oldest":
        return matched.sort((a, b) => byDate(a.createdAt) - byDate(b.createdAt));
      case "nameAsc":
        /* Collated for the active locale so Georgian names sort by the
           Georgian alphabet rather than by code point. */
        return matched.sort((a, b) => a.fullname.localeCompare(b.fullname, locale));
      case "emailAsc":
        return matched.sort((a, b) => a.email.localeCompare(b.email));
      case "role":
        return matched.sort((a, b) => a.role.localeCompare(b.role));
      default:
        return matched.sort((a, b) => byDate(b.createdAt) - byDate(a.createdAt));
    }
  }, [rows, search, role, provider, state, sort, locale]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const paged = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  /* Any change to what is being filtered starts again from the first page. */
  const narrow = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const onDelete = async () => {
    if (!target) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteUserById(target._id);
      setTarget(null);
    } catch (failure) {
      setDeleteError(failure instanceof Error ? failure.message : t("filters.couldNotDeleteUser"));
    } finally {
      setDeleting(false);
    }
  };

  const staff = rows.filter((row) => row.role !== "user").length;
  const customers = rows.length - staff;
  const problem = deleteError ?? error;

  return (
    <div className="space-y-8">
      <ConsoleHeader
        breadcrumb={[
          { label: t("breadcrumb.console"), href: config.base },
          { label: t("breadcrumb.users") },
        ]}
        title={t("users.title")}
        description={
          loading && !users
            ? t("users.loading")
            : t("filters.usersSummary", {
                total: formatCount(rows.length),
                verified: formatCount(customers),
                staff: formatCount(staff),
              })
        }
        actions={
          <ButtonLink href={`${config.base}/users/new`}>
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            {t("users.newUser")}
          </ButtonLink>
        }
      />

      {problem && (
        <p className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-px size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {problem}
        </p>
      )}

      <div className="rounded-lg border border-line bg-canvas">
        <Toolbar
          searchPlaceholder={t("filters.searchUsers")}
          search={search}
          onSearchChange={narrow(setSearch)}
          filters={[
            {
              id: "filter-role",
              label: t("filters.role"),
              options: [
                { value: "all", label: t("filters.anyRole") },
                ...ROLES.map((option) => ({
                  value: option.value,
                  label: t(`roles.${option.key}`),
                })),
              ],
              value: role,
              onChange: narrow(setRole),
            },
            {
              id: "filter-provider",
              label: t("users.signIn"),
              options: [
                { value: "any", label: t("users.anySignIn") },
                { value: "local", label: t("users.email") },
                { value: "google", label: t("users.google") },
              ],
              value: provider,
              onChange: narrow(setProvider),
            },
            {
              id: "filter-state",
              label: t("filters.verification"),
              options: [
                { value: "any", label: t("filters.anyVerification") },
                { value: "verified", label: t("pills.verified") },
                { value: "pending", label: t("pills.pending") },
              ],
              value: state,
              onChange: narrow(setState),
            },
            {
              id: "filter-user-sort",
              label: t("filters.sort"),
              options: USER_SORTS.map((key) => ({ value: key, label: t(`sorts.${key}`) })),
              value: sort,
              onChange: setSort,
            },
          ]}
          meta={t("filters.usersMeta", {
            shown: formatCount(visible.length),
            total: formatCount(rows.length),
          })}
        />

        {loading && !users ? (
          <p className="flex items-center justify-center gap-2.5 px-5 py-16 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
            {t("users.loading")}
          </p>
        ) : visible.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              icon={<Users className="size-6" strokeWidth={1.5} aria-hidden />}
              title={rows.length ? t("filters.noMatch") : t("filters.noUsersYet")}
              description={
                rows.length ? t("empty.widenFilters") : t("empty.addFirstUser")
              }
            />
          </div>
        ) : (
          <Table
            head={
              <>
                <Th>{t("users.account")}</Th>
                <Th>{t("table.role")}</Th>
                <Th>{t("users.signIn")}</Th>
                <Th>{t("filters.verification")}</Th>
                <Th>{t("table.joined")}</Th>
                <Th align="right">{t("table.actions")}</Th>
              </>
            }
          >
            {paged.map((row) => (
              <Tr key={row._id}>
                <Td>
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-xs font-medium text-ink"
                    >
                      {initialsOf(row.fullname)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{row.fullname}</span>
                      <span className="block truncate text-xs text-ink-subtle">{row.email}</span>
                    </span>
                  </span>
                </Td>

                <Td>
                  <RolePill role={row.role} />
                </Td>

                <Td>
                  <span>{row.provider === "local" ? t("users.email") : t("users.google")}</span>
                </Td>

                <Td>
                  <VerifiedPill verified={Boolean(row.isVerifed)} />
                </Td>

                <Td>
                  <span className="whitespace-nowrap text-xs text-ink-subtle">
                    {dates.short(row.createdAt)}
                  </span>
                </Td>

                <Td align="right">
                  <span className="flex items-center justify-end gap-1">
                    <Link
                      href={`${config.base}/users/${row._id}`}
                      aria-label={t("table.editNamed", { name: row.fullname })}
                      className={iconButton}
                    >
                      <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setTarget(row);
                      }}
                      aria-label={t("table.deleteNamed", { name: row.fullname })}
                      className={`${iconButton} hover:bg-danger/10 hover:text-danger`}
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        <Pager page={current} pages={pages} onChange={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        title={t("users.confirmDeleteTitle")}
        body={t("users.confirmDeleteBody", {
          name: `${target?.fullname ?? ""} (${target?.email ?? ""})`,
        })}
        confirmLabel={t("users.confirmDeleteAction")}
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
