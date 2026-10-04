/**
 * Shared password rules so signup, reset and change-password all enforce
 * exactly the same strength requirements.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // Supabase / bcrypt limit

export type PasswordChecks = {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  withinMax: boolean;
  strong: boolean;
};

export function checkPassword(password: string): PasswordChecks {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const withinMax = password.length <= PASSWORD_MAX_LENGTH;
  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    withinMax,
    strong: hasMinLength && hasUppercase && hasLowercase && hasNumber && withinMax,
  };
}

export const PASSWORD_RULES_MESSAGE =
  "Password must be 8 to 72 characters with an uppercase letter, a lowercase letter, and a number.";

/**
 * Only allow same-origin relative redirects ("/dashboard", "/add?x=1").
 * Blocks open redirects such as "https://evil.com", "//evil.com" or "/\\evil.com".
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  const v = value.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\") || /[\r\n\t]/.test(v)) {
    return fallback;
  }
  return v;
}
