import DOMPurify from "dompurify";

/** Strips any HTML/script content from user-entered text before it is stored. */
export function cleanText(value: string, maxLength = 200): string {
  const stripped =
    typeof window === "undefined"
      ? value.replace(/<[^>]*>/g, "")
      : DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return stripped.trim().slice(0, maxLength);
}

export const PK_PHONE_REGEX = /^(?:\+92|0)3\d{2}-?\d{7}$/;