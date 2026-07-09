const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 32;

export function sanitizeProfileField(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) return trimmed.slice(0, maxLength);
  return trimmed;
}

export function sanitizeFullName(value: unknown) {
  return sanitizeProfileField(value, MAX_NAME_LENGTH);
}

export function sanitizePhone(value: unknown) {
  const phone = sanitizeProfileField(value, MAX_PHONE_LENGTH);
  if (phone === undefined || phone === null) return phone;
  if (!/^[\d\s+\-().]+$/.test(phone)) return null;
  return phone;
}
