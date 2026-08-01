// Webhook Service Unit Tests
// Tests for critical webhook service methods

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookService } from '../webhook.service';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock crypto.getRandomValues
global.crypto = {
  getRandomValues: vi.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  subtle: {
    importKey: vi.fn(),
    sign: vi.fn(),
  },
} as any;

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService();
    vi.clearAllMocks();
  });

  describe('HMAC Signature Generation', () => {
    it('should generate HMAC-SHA256 signature', async () => {
      const testData = { test: 'data', value: 123 };
      
      // Mock crypto.subtle.importKey and sign
      const mockSignature = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      (global.crypto.subtle.importKey as any).mockResolvedValue('mock-key');
      (global.crypto.subtle.sign as any).mockResolvedValue(mockSignature);
      
      const signature = await (webhookService as any).generateSignature(testData);
      
      expect(signature).toBeDefined();
      expect(signature).toMatch(/^sha256=/);
      expect(signature).toContain('0102030405060708');
    });

    it('should use provided secret when available', async () => {
      const testData = { test: 'data' };
      const customSecret = 'custom-secret-key';
      
      const mockSignature = new Uint8Array([1, 2, 3, 4]);
      (global.crypto.subtle.importKey as any).mockResolvedValue('mock-key');
      (global.crypto.subtle.sign as any).mockResolvedValue(mockSignature);
      
      await (webhookService as any).generateSignature(testData, customSecret);
      
      expect(global.crypto.subtle.importKey).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Uint8Array),
        expect.objectContaining({ name: 'HMAC', hash: 'SHA-256' }),
        false,
        ['sign']
      );
    });

    it('should handle complex data structures', async () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
      };
      
      const mockSignature = new Uint8Array([1, 2, 3, 4]);
      (global.crypto.subtle.importKey as any).mockResolvedValue('mock-key');
      (global.crypto.subtle.sign as any).mockResolvedValue(mockSignature);
      
      const signature = await (webhookService as any).generateSignature(complexData);
      
      expect(signature).toBeDefined();
      expect(signature).toMatch(/^sha256=/);
    });
  });

  describe('Signature Verification', () => {
    it('should verify correct signature', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const mockSignature = new Uint8Array([1, 2, 3, 4]);
      
      (global.crypto.subtle.importKey as any).mockResolvedValue('mock-key');
      (global.crypto.subtle.sign as any).mockResolvedValue(mockSignature);
      
      const expectedSignature = await (webhookService as any).generateSignature({ test: 'data' });
      const isValid = await webhookService.verifySignature(payload, expectedSignature);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect signature', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const incorrectSignature = 'sha256=incorrect';
      
      const isValid = await webhookService.verifySignature(payload, incorrectSignature);
      
      expect(isValid).toBe(false);
    });

    it('should use custom secret when provided', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const customSecret = 'custom-secret';
      const mockSignature = new Uint8Array([1, 2, 3, 4]);
      
      (global.crypto.subtle.importKey as any).mockResolvedValue('mock-key');
      (global.crypto.subtle.sign as any).mockResolvedValue(mockSignature);
      
      const expectedSignature = await (webhookService as any).generateSignature({ test: 'data' }, customSecret);
      const isValid = await webhookService.verifySignature(payload, expectedSignature, customSecret);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Secret Generation', () => {
    it('should generate random secret', () => {
      const secret = (webhookService as any).generateSecret();
      
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBe(64); // 32 bytes * 2 hex chars per byte
      expect(secret).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate different secrets on each call', () => {
      const secret1 = (webhookService as any).generateSecret();
      const secret2 = (webhookService as any).generateSecret();
      
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('Retry Logic', () => {
    it('should implement exponential backoff', () => {
      const delays = (webhookService as any).RETRY_DELAYS;
      
      expect(delays).toEqual([1000, 5000, 15000]);
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
    });

    it('should respect max retries', () => {
      const maxRetries = (webhookService as any).MAX_RETRIES;
      
      expect(maxRetries).toBe(3);
    });
  });
});
