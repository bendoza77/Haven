"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Picks photography off the operator's own machine rather than asking for a
 * URL: the files go straight to the API, which stores them and answers with
 * the addresses they are served from. Only those addresses reach the form.
 *
 * The first image in the list is the one the shop uses on cards and in search
 * results, so it is labelled and can be changed without re-uploading.
 */
export default function ImagePicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("console.imagePicker");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const response = await api.products.uploadImages(Array.from(files));
      onChange([...value, ...response.data]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("uploadFailed"));
    } finally {
      setUploading(false);
      // Let the same file be chosen again after a removal.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => onChange(value.filter((_, at) => at !== index));

  const makePrimary = (index: number) => {
    const next = [...value];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((src, index) => (
          <figure
            key={`${src}-${index}`}
            className={cn(
              "group relative aspect-4/3 overflow-hidden rounded-md bg-surface ring-1",
              index === 0 ? "ring-2 ring-ink" : "ring-line",
            )}
          >
            {/* A plain img: these point at the API host, and at whatever host
                the store is deployed behind later. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />

            {index === 0 && (
              <figcaption className="absolute left-1.5 top-1.5 rounded-sm bg-ink px-1.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-canvas">
                Primary
              </figcaption>
            )}

            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => makePrimary(index)}
                  disabled={disabled}
                  aria-label={t("makePrimary")}
                  className="flex size-7 items-center justify-center rounded-sm bg-canvas/90 text-ink shadow-card transition-colors hover:bg-canvas"
                >
                  <Star className="size-3.5" strokeWidth={1.75} aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={t("removeImage")}
                className="flex size-7 items-center justify-center rounded-sm bg-canvas/90 text-danger shadow-card transition-colors hover:bg-danger hover:text-canvas"
              >
                <X className="size-3.5" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </figure>
        ))}

        <label
          htmlFor={inputId}
          className={cn(
            "flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line-strong text-center text-xs text-ink-muted transition-colors hover:border-ink hover:text-ink",
            (disabled || uploading) && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" strokeWidth={1.75} aria-hidden />
          ) : (
            <ImagePlus className="size-5" strokeWidth={1.75} aria-hidden />
          )}
          {uploading ? t("uploading") : t("chooseImages")}
        </label>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          disabled={disabled || uploading}
          onChange={(event) => handleFiles(event.target.files)}
          className="sr-only"
        />
      </div>

      <p className="mt-3 text-xs text-ink-subtle">
        {t("formats")}
      </p>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
