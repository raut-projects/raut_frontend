const EMAIL_MAX_LENGTH = 254;
const LOCAL_PART_MAX_LENGTH = 64;
const DOMAIN_MAX_LENGTH = 253;
const LABEL_MAX_LENGTH = 63;

const GENERIC_EMAIL_ERROR =
  "Please enter a valid email address (for example admin@raut.africa).";

const LOCAL_PART_PATTERN = /^[A-Za-z0-9._%+'-]+$/;
const LABEL_PATTERN = /^[A-Za-z0-9-]+$/;
const TLD_PATTERN = /^[A-Za-z]{2,}$/;

export function validateEmail(value: string): string | null {
  const email = String(value ?? "").trim();

  if (!email) return "Please enter your email address.";
  if (/\s/.test(email)) return "Email addresses can't contain spaces.";
  if (email.length > EMAIL_MAX_LENGTH) return "That email address is too long.";

  const atCount = (email.match(/@/g) ?? []).length;
  if (atCount !== 1) {
    return "Email addresses need exactly one @ symbol (for example admin@raut.africa).";
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) return GENERIC_EMAIL_ERROR;

  if (localPart.length > LOCAL_PART_MAX_LENGTH) {
    return "That email address is too long.";
  }

  if (
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return GENERIC_EMAIL_ERROR;
  }

  if (!LOCAL_PART_PATTERN.test(localPart)) {
    return "The part before @ contains characters we don't recognize. Please check it.";
  }

  if (domain.length > DOMAIN_MAX_LENGTH) {
    return "That email address is too long.";
  }

  const labels = domain.split(".");

  if (labels.length < 2) {
    return "That email address looks incomplete. Add a domain ending, such as .com or .co.tz.";
  }

  const tld = labels[labels.length - 1];

  if (!TLD_PATTERN.test(tld)) {
    return "That email address needs a valid ending, such as .com or .co.tz.";
  }

  for (const label of labels) {
    if (!label || label.length > LABEL_MAX_LENGTH) return GENERIC_EMAIL_ERROR;
    if (!LABEL_PATTERN.test(label)) return GENERIC_EMAIL_ERROR;
    if (label.startsWith("-") || label.endsWith("-")) {
      return GENERIC_EMAIL_ERROR;
    }
  }

  return null;
}
