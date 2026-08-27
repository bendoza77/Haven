import { ConsoleAuthProvider } from "@/context/ConsoleAuthContext";
import { ReviewProvider } from "@/context/ReviewContext";
import { UserProvider } from "@/context/UserContext";

/**
 * Everything staff-facing sits under one session.
 *
 * The providers live here rather than in each console's own layout so that
 * moving between /admin-console and /moderator-console does not tear down and
 * re-establish the session — Next keeps this layout mounted across both.
 *
 * Neither data provider fetches anything on mount, so a console carrying one
 * it does not use costs nothing.
 */
export default function ConsoleGroupLayout({ children }: LayoutProps<"/">) {
  return (
    <ConsoleAuthProvider>
      <UserProvider>
        <ReviewProvider>{children}</ReviewProvider>
      </UserProvider>
    </ConsoleAuthProvider>
  );
}
