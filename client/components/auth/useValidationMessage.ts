"use client";

import { useTranslations } from "next-intl";
import type { ValidationKey } from "@/lib/auth";

/**
 * Turns the message keys the validators in `lib/auth` return into a sentence
 * in the reader's language.
 *
 * The validators cannot do this themselves — they are plain functions with no
 * access to React context — so the rule and its wording meet here, at the one
 * point that already knows both which field failed and which language the
 * page is in.
 */
export function useValidationMessage() {
  const t = useTranslations("validation");
  /* Accepts undefined as well as null: the forms hold their per-field errors
     in a partial record, where "no error" is a missing key. */
  return (key: ValidationKey | undefined) => (key ? t(key) : null);
}
