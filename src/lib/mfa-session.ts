const MFA_PENDING_KEY = "gesclic_mfa_pending";
const REMEMBER_KEY = "gesclic_remember";
const TAB_SESSION_KEY = "gesclic_session_tab";

export function setRememberMe(remember: boolean) {
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  sessionStorage.setItem(TAB_SESSION_KEY, "1");
}

/** When remember-me is off, restore the session only in the same browser tab. */
export function shouldRestorePersistedSession(): boolean {
  if (typeof window === "undefined") return true;
  if (localStorage.getItem(REMEMBER_KEY) !== "0") return true;
  return sessionStorage.getItem(TAB_SESSION_KEY) === "1";
}

export function setMfaPending(userId: string) {
  sessionStorage.setItem(MFA_PENDING_KEY, userId);
}

export function clearMfaPending() {
  sessionStorage.removeItem(MFA_PENDING_KEY);
}

export function getMfaPendingUserId(): string | null {
  return sessionStorage.getItem(MFA_PENDING_KEY);
}

export function isMfaPending(): boolean {
  return Boolean(sessionStorage.getItem(MFA_PENDING_KEY));
}

const ENFORCE_2FA_KEY = "gesclic_enforce_2fa_setup";

export function setEnforce2faSetup() {
  sessionStorage.setItem(ENFORCE_2FA_KEY, "1");
}

export function clearEnforce2faSetup() {
  sessionStorage.removeItem(ENFORCE_2FA_KEY);
}

export function isEnforce2faSetup(): boolean {
  return sessionStorage.getItem(ENFORCE_2FA_KEY) === "1";
}
