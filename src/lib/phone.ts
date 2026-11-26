/**
 * Validates and normalizes a Sri Lankan mobile number (`07XXXXXXXX` or `+947XXXXXXXX`)
 * into canonical E.164 format (`+947XXXXXXXX`). Returns `null` if invalid.
 */
export function normalizeSriLankanPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, "").trim();

  if (/^07\d{8}$/.test(cleaned)) {
    return `+94${cleaned.slice(1)}`;
  }

  if (/^\+947\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^947\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^00947\d{8}$/.test(cleaned)) {
    return `+${cleaned.slice(2)}`;
  }

  return null;
}
