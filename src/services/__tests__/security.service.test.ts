// Security Service Unit Tests
// Tests for critical security service methods (MFA, TOTP verification)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityService } from '../security.service';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock speakeasy
const mockSpeakeasy = {
  totp: {
    verify: vi.fn(),
  },
};

vi.mock('speakeasy', () => mockSpeakeasy);

describe('SecurityService', () => {
  let securityService: SecurityService;

  beforeEach(() => {
    securityService = new SecurityService();
    vi.clearAllMocks();
  });

  describe('TOTP Verification', () => {
    it('should verify valid TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const validCode = '123456';
      
      (mockSpeakeasy.totp.verify as any).mockReturnValue(true);
      
      const isValid = (securityService as any).verifyTOTP(secret, validCode);
      
      expect(isValid).toBe(true);
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith({
        secret: secret,
        encoding: 'base32',
        token: validCode,
        window: 2,
      });
    });

    it('should reject invalid TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const invalidCode = '000000';
      
      (mockSpeakeasy.totp.verify as any).mockReturnValue(false);
      
      const isValid = (securityService as any).verifyTOTP(secret, invalidCode);
      
      expect(isValid).toBe(false);
    });

    it('should handle verification errors gracefully', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = '123456';
      
      (mockSpeakeasy.totp.verify as any).mockImplementation(() => {
        throw new Error('Verification error');
      });
      
      const isValid = (securityService as any).verifyTOTP(secret, code);
      
      expect(isValid).toBe(false);
    });

    it('should use correct encoding (base32)', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = '123456';
      
      (mockSpeakeasy.totp.verify as any).mockReturnValue(true);
      
      (securityService as any).verifyTOTP(secret, code);
      
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith(
        expect.objectContaining({
          encoding: 'base32',
        })
      );
    });

    it('should use clock skew tolerance (window: 2)', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = '123456';
      
      (mockSpeakeasy.totp.verify as any).mockReturnValue(true);
      
      (securityService as any).verifyTOTP(secret, code);
      
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith(
        expect.objectContaining({
          window: 2,
        })
      );
    });
  });

  describe('QR Code Generation', () => {
    it('should generate valid QR code URL', () => {
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';
      
      const qrUrl = (securityService as any).generateQRCodeUrl(email, secret);
      
      expect(qrUrl).toBeDefined();
      expect(qrUrl).toContain('https://api.qrserver.com/v1/create-qr-code/');
      expect(qrUrl).toContain('otpauth://totp/');
      expect(qrUrl).toContain('Gesclic');
      expect(qrUrl).toContain(email);
      expect(qrUrl).toContain(secret);
    });

    it('should properly encode email and issuer', () => {
      const email = 'test+special@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';
      
      const qrUrl = (securityService as any).generateQRCodeUrl(email, secret);
      
      expect(qrUrl).toContain(encodeURIComponent('Gesclic'));
      expect(qrUrl).toContain(encodeURIComponent(email));
    });
  });

  describe('Backup Code Generation', () => {
    it('should generate 10 backup codes', () => {
      const backupCodes = (securityService as any).generateBackupCodes();
      
      expect(backupCodes).toBeDefined();
      expect(Array.isArray(backupCodes)).toBe(true);
      expect(backupCodes.length).toBe(10);
    });

    it('should generate unique backup codes', () => {
      const backupCodes = (securityService as any).generateBackupCodes();
      const uniqueCodes = new Set(backupCodes);
      
      expect(uniqueCodes.size).toBe(10);
    });

    it('should generate codes with correct format', () => {
      const backupCodes = (securityService as any).generateBackupCodes();
      
      backupCodes.forEach((code: string) => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });
  });

  describe('Secret Generation', () => {
    it('should generate valid base32 secret', () => {
      const secret = (securityService as any).generateSecret();
      
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
      // Base32 characters: A-Z, 2-7, =
      expect(secret).toMatch(/^[A-Z2-7=]+$/);
    });

    it('should generate unique secrets', () => {
      const secret1 = (securityService as any).generateSecret();
      const secret2 = (securityService as any).generateSecret();
      
      expect(secret1).not.toBe(secret2);
    });

    it('should generate secrets of appropriate length', () => {
      const secret = (securityService as any).generateSecret();
      
      // Base32 typically produces 32-character secrets for 160-bit entropy
      expect(secret.length).toBeGreaterThanOrEqual(16);
      expect(secret.length).toBeLessThanOrEqual(64);
    });
  });
});
