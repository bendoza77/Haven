/**
 * Validation shared by the sign-in, sign-up and reset forms.
 *
 * The rules mirror the ones the account API enforces (3–50 character name,
 * 6–50 character password, no spaces) so nobody gets a surprise error after
 * the round trip.
 *
 * These return message *keys* rather than sentences. Validation runs in the
 * browser where the dictionary is a hook away, and a bare module cannot reach
 * one — so the rule stays here and the wording stays with the translations,
 * under the `validation` namespace. Callers render `t(key)`.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Key into the `validation` message namespace, or null when the value is fine. */
export type ValidationKey = string | null;

export function validateEmail(value: string): ValidationKey {
  const email = value.trim();
  if (!email) return "emailRequired";
  if (!emailPattern.test(email)) return "emailIncomplete";
  return null;
}

export function validateName(value: string): ValidationKey {
  const name = value.trim();
  if (!name) return "nameRequired";
  if (name.length < 3) return "nameTooShort";
  if (name.length > 50) return "nameTooLong";
  return null;
}

export function validateNewPassword(value: string): ValidationKey {
  if (!value) return "passwordRequired";
  if (value.length < 6) return "passwordTooShort";
  if (value.length > 50) return "passwordTooLong";
  if (/\s/.test(value)) return "passwordNoSpaces";
  return null;
}

/** Sign-in only checks presence — an existing password is never re-judged. */
export function validateCurrentPassword(value: string): ValidationKey {
  return value ? null : "currentPasswordRequired";
}

/* The colours are presentation and stay here; only `key` crosses into the
   dictionary. */
const levels = [
  { key: "weak", bar: "bg-danger", text: "text-danger" },
  { key: "fair", bar: "bg-warning", text: "text-warning" },
  { key: "good", bar: "bg-accent", text: "text-accent" },
  { key: "strong", bar: "bg-success", text: "text-success" },
] as const;

/** Four-step score for the meter under the sign-up password field. */
export function passwordStrength(value: string) {
  if (!value) return null;

  const passed = [
    value.length >= 8,
    value.length >= 12,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^\w\s]/.test(value),
  ].filter(Boolean).length;

  const level = Math.min(3, Math.max(0, passed - 1));
  return { level, ...levels[level] };
}
