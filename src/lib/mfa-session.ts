const MFA_PENDING_KEY = "gesclic_mfa_pending";

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
