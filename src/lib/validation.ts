// Email validation for forms. Checks length limits, a single @, local-part
// characters and dotted domain labels, returning a user-facing error string or
// null when the address is acceptable.

const EMAIL_MAX_LENGTH = 254;
const LOCAL_PART_MAX_LENGTH = 64;
const DOMAIN_MAX_LENGTH = 253;
const LABEL_MAX_LENGTH = 63;

const GENERIC_EMAIL_ERROR =
  "Please enter a valid email address (for example admin@raut.africa).";

const LOCAL_PART_PATTERN = /^[A-Za-z0-9._%+'-]+$/;
const LABEL_PATTERN = /^[A-Za-z0-9-]+$/;
const TLD_PATTERN = /^[A-Za-z]{2,}$/;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const PHONE_MAX_LENGTH = 24;

/**
 * Validates an email address and returns a user-facing error message.
 *
 * Enforces the RFC length caps, exactly one @, a well-formed local part (no
 * leading/trailing/double dots) and a dotted domain whose labels are
 * alphanumeric with hyphens and a letters-only TLD of 2+ characters.
 *
 * @returns The first error found, or null when the address is valid.
 */
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

/**
 * Validates a new password for reset/update flows.
 *
 * @returns An error message, or null when the password is acceptable.
 */
export function validateNewPassword(value: string): string | null {
  const password = String(value ?? "");

  if (!password) return "Please enter a new password.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }

  return null;
}

/**
 * Formats a Tanzania mobile number (9 local digits) as +255 E.164.
 */
export function toTanzaniaE164Phone(value: string): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  const local = digits.startsWith("255")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  return `+255${local.slice(0, 9)}`;
}

/**
 * Validates a Tanzania mobile number entered as 9 local digits.
 */
export function validateTanzaniaPhone(value: string): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  const local = digits.startsWith("255")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  if (!local) return "Please enter a phone number.";
  if (local.length !== 9) return "Enter a valid 9-digit mobile number.";

  const phone = `+255${local}`;
  if (phone.length > PHONE_MAX_LENGTH) {
    return "That phone number is too long.";
  }

  return null;
}

/**
 * Validates that a password confirmation matches the new password.
 *
 * @returns An error message, or null when the values match.
 */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (!String(confirmation ?? "")) return "Please confirm your new password.";
  if (String(password ?? "") !== String(confirmation ?? "")) {
    return "Passwords do not match.";
  }

  return null;
}
