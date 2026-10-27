import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn() },
}));

vi.mock("@/lib/admin-db", () => ({
  fromAdmin: vi.fn(),
}));

import { platformPolicyService, type PlatformSecurityPolicy } from "../platform-policy.service";

const policy: PlatformSecurityPolicy = {
  enforce2FA: true,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 10,
  requireStrongPassword: true,
  ipWhitelist: "1.1.1.1",
  ipBlacklist: "8.8.8.8",
};

describe("platformPolicyService", () => {
  it("rejects weak passwords", () => {
    expect(platformPolicyService.passwordMeetsPolicy("short", policy).ok).toBe(false);
    expect(platformPolicyService.passwordMeetsPolicy("longenough1", policy).ok).toBe(false);
    expect(platformPolicyService.passwordMeetsPolicy("LongEnough1", policy).ok).toBe(true);
  });

  it("applies IP allow/deny lists", () => {
    expect(platformPolicyService.ipAllowed("8.8.8.8", policy).ok).toBe(false);
    expect(platformPolicyService.ipAllowed("2.2.2.2", policy).ok).toBe(false);
    expect(platformPolicyService.ipAllowed("1.1.1.1", policy).ok).toBe(true);
    expect(platformPolicyService.ipAllowed(null, policy).ok).toBe(true);
  });
});
