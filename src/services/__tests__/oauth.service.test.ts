// OAuth Service Unit Tests
// Tests for critical OAuth service methods

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuthService } from '../oauth.service';

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

describe('OAuthService', () => {
  let oauthService: OAuthService;

  beforeEach(() => {
    oauthService = new OAuthService();
    vi.clearAllMocks();
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const testData = 'test-secret-token-12345';
      
      // Access private method for testing
      const encrypted = await (oauthService as any).encrypt(testData);
      const decrypted = await (oauthService as any).decrypt(encrypted);
      
      expect(decrypted).toBe(testData);
    });

    it('should produce different encrypted values for same data (due to random IV)', async () => {
      const testData = 'test-secret-token-12345';
      
      const encrypted1 = await (oauthService as any).encrypt(testData);
      const encrypted2 = await (oauthService as any).encrypt(testData);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should decrypt to original value regardless of encryption', async () => {
      const testData = 'test-secret-token-12345';
      
      const encrypted1 = await (oauthService as any).encrypt(testData);
      const encrypted2 = await (oauthService as any).encrypt(testData);
      
      const decrypted1 = await (oauthService as any).decrypt(encrypted1);
      const decrypted2 = await (oauthService as any).decrypt(encrypted2);
      
      expect(decrypted1).toBe(testData);
      expect(decrypted2).toBe(testData);
    });

    it('should handle empty strings', async () => {
      const testData = '';
      
      const encrypted = await (oauthService as any).encrypt(testData);
      const decrypted = await (oauthService as any).decrypt(encrypted);
      
      expect(decrypted).toBe(testData);
    });

    it('should handle special characters', async () => {
      const testData = 'test@#$%^&*()_+-={}[]|\\:";\'<>?,./`~';
      
      const encrypted = await (oauthService as any).encrypt(testData);
      const decrypted = await (oauthService as any).decrypt(encrypted);
      
      expect(decrypted).toBe(testData);
    });

    it('should handle long strings', async () => {
      const testData = 'a'.repeat(10000);
      
      const encrypted = await (oauthService as any).encrypt(testData);
      const decrypted = await (oauthService as any).decrypt(encrypted);
      
      expect(decrypted).toBe(testData);
    });
  });

  describe('State Generation and Validation', () => {
    it('should generate valid state parameter', async () => {
      const state = await oauthService.generateState();
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should validate correct state parameter', async () => {
      const state = await oauthService.generateState();
      const isValid = await oauthService.validateState(state);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid state parameter', async () => {
      const invalidState = 'invalid-state';
      const isValid = await oauthService.validateState(invalidState);
      
      expect(isValid).toBe(false);
    });

    it('should reject expired state parameter', async () => {
      // Generate a state with old timestamp
      const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      const timestamp = oldTimestamp.toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      const userId = 'test-user-id';
      const oldState = btoa(`${timestamp}:${random}:${userId}`);
      
      const isValid = await oauthService.validateState(oldState);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Token Refresh Logic', () => {
    it('should determine if token needs refresh', () => {
      const expiredToken = {
        expires_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      };
      
      const needsRefresh = (oauthService as any).needsRefresh(expiredToken);
      expect(needsRefresh).toBe(true);
    });

    it('should determine if token does not need refresh', () => {
      const validToken = {
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
      };
      
      const needsRefresh = (oauthService as any).needsRefresh(validToken);
      expect(needsRefresh).toBe(false);
    });

    it('should handle tokens without expiration', () => {
      const tokenWithoutExpiry = {};
      
      const needsRefresh = (oauthService as any).needsRefresh(tokenWithoutExpiry);
      expect(needsRefresh).toBe(false);
    });
  });
});
