import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase, used for one thing only: the sign-in gate on the two consoles.
 *
 * The storefront does not touch this — shoppers still sign in against the
 * Express API, and their session is the `hv` cookie. Staff are a separate
 * population living in Firebase Auth, created by hand in the Firebase console.
 * Keeping the two apart is deliberate: it means a shopper account can never
 * become a way into the console, whatever its role says.
 *
 * Every value below is public by design. Firebase web config identifies the
 * project, it does not authorise anything — the real gate is which accounts
 * exist in Authentication, and, for writes, the role check on the API.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Whether the six values above actually arrived.
 *
 * Next inlines missing env vars as `undefined`, and `initializeApp` with an
 * undefined apiKey fails later and further away — inside a sign-in call, as an
 * opaque `auth/invalid-api-key`. Checking here lets the login form say plainly
 * that the project is not configured yet, which is the one error a reader can
 * actually act on.
 */
export const firebaseReady = Object.values(config).every(Boolean);

/** Missing config is reported by the form, so nothing here throws on import. */
export function getFirebaseAuth(): Auth | null {
  if (!firebaseReady) return null;

  /* Next's dev server re-evaluates modules on refresh, and initialising twice
     under the same name throws — so reuse whatever is already there. */
  const app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp(config as Required<typeof config>);

  return getAuth(app);
}
