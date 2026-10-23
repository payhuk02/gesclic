import { describe, it, expect } from 'vitest';
import {
  computePlanTotal,
  formatPlanPriceLines,
  getBillingPeriod,
} from '../clinic-plans';

describe('computePlanTotal', () => {
  it('returns monthly price as-is for 1 month', () => {
    const p = computePlanTotal(5900, 1)!;
    expect(p.listTotal).toBe(5900);
    expect(p.total).toBe(5900);
    expect(p.monthlyEquivalent).toBe(5900);
    expect(p.discountPercent).toBe(0);
    expect(p.savings).toBe(0);
  });

  it('applies 10% on quarterly (3 months)', () => {
    // 7500 × 3 = 22500 → −10% = 20250 → ~6750 / mois
    const p = computePlanTotal(7500, 3)!;
    expect(p.listTotal).toBe(22500);
    expect(p.total).toBe(20250);
    expect(p.monthlyEquivalent).toBe(6750);
    expect(p.discountPercent).toBe(10);
    expect(p.savings).toBe(2250);
  });

  it('applies 20% on semestrial (6 months)', () => {
    const p = computePlanTotal(12500, 6)!;
    expect(p.listTotal).toBe(75000);
    expect(p.total).toBe(60000);
    expect(p.monthlyEquivalent).toBe(10000);
    expect(p.discountPercent).toBe(20);
  });

  it('applies 30% on annual (12 months)', () => {
    const p = computePlanTotal(5900, 12)!;
    expect(p.listTotal).toBe(70800);
    expect(p.total).toBe(49560);
    expect(p.monthlyEquivalent).toBe(4130);
    expect(p.discountPercent).toBe(30);
  });

  it('returns null for custom / null price', () => {
    expect(computePlanTotal(null, 3)).toBeNull();
  });
});

describe('formatPlanPriceLines', () => {
  it('formats monthly display', () => {
    const lines = formatPlanPriceLines(computePlanTotal(5900, 1)!, 'Mensuel');
    expect(lines.strike).toBeNull();
    expect(lines.headline).toContain('5');
    expect(lines.detail).toMatch(/\/ mois/);
  });

  it('formats discounted period like Acoschool', () => {
    const period = getBillingPeriod(3);
    // 5000 × 3 = 15 000 → −10 % = 13 500 → ~4 500 / mois
    const lines = formatPlanPriceLines(computePlanTotal(5000, 3)!, period.label);
    expect(lines.strike).toMatch(/15/);
    expect(lines.headline).toMatch(/13/);
    expect(lines.detail).toMatch(/soit ~/);
    expect(lines.detail).toMatch(/Trimestriel/);
    expect(lines.detail).toMatch(/−10 %/);
  });
});
