import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moneyfusionService } from '@/services/moneyfusion.service';
import { CLINIC_PLANS, computePlanTotal } from '@/lib/clinic-plans';

describe('moneyfusionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects initiation for custom or quote-only plans', async () => {
    await expect(
      moneyfusionService.initiateSubscriptionPayment({
        clinicId: 'clinic-123',
        planId: 'custom',
        billingMonths: 1,
        clientName: 'Dr Test',
        phoneNumber: '0102030405',
      })
    ).rejects.toThrow('Ce plan ne peut pas être réglé en ligne');
  });

  it('validates phone number requirement', async () => {
    await expect(
      moneyfusionService.initiateSubscriptionPayment({
        clinicId: 'clinic-123',
        planId: 'pro',
        billingMonths: 1,
        clientName: 'Dr Test',
        phoneNumber: '123', // too short
      })
    ).rejects.toThrow('Veuillez renseigner un numéro de téléphone valide');
  });

  it('rejects empty payment tokens in checkPaymentStatus', async () => {
    await expect(moneyfusionService.checkPaymentStatus('')).rejects.toThrow(
      'Token de paiement invalide'
    );
  });

  it('accurately computes subscription totals for MoneyFusion payload', () => {
    const proPlan = CLINIC_PLANS.find((p) => p.id === 'pro');
    expect(proPlan).toBeDefined();

    // 1 month: 7500 FCFA
    const monthly = computePlanTotal(proPlan!.monthlyPrice, 1);
    expect(monthly?.total).toBe(7500);
    expect(monthly?.discountPercent).toBe(0);

    // 3 months (-10%): 7500 * 3 = 22500 -> -10% = 20250 FCFA
    const trimestriel = computePlanTotal(proPlan!.monthlyPrice, 3);
    expect(trimestriel?.total).toBe(20250);
    expect(trimestriel?.savings).toBe(2250);

    // 12 months (-30%): 7500 * 12 = 90000 -> -30% = 63000 FCFA
    const annuel = computePlanTotal(proPlan!.monthlyPrice, 12);
    expect(annuel?.total).toBe(63000);
    expect(annuel?.savings).toBe(27000);
  });

  it('correctly handles paid response in checkPaymentStatus', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        statut: true,
        message: 'details paiement',
        data: {
          tokenPay: 'test-token-123',
          statut: 'paid',
          Montant: 20250,
          nomclient: 'Dr Test',
          numeroSend: '0102030405',
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await moneyfusionService.checkPaymentStatus('test-token-123');
    expect(result.statut).toBe(true);
    expect(result.data?.statut).toBe('paid');
    expect(result.data?.Montant).toBe(20250);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://pay.moneyfusion.net/paiementNotif/test-token-123',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
