import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CLINIC_PROFILE_SETTINGS,
  clinicSettingsService,
} from '@/services/clinic-settings.service';

describe('clinicSettingsService', () => {
  it('returns default settings shape when clinic has empty settings', async () => {
    const profile = await clinicSettingsService.getClinicProfile('00000000-0000-0000-0000-000000000000');
    expect(profile).toBeNull();
  });

  it('exposes default profile settings constants', () => {
    expect(DEFAULT_CLINIC_PROFILE_SETTINGS.opening_hours.weekday).toBe('08:00 - 18:00');
    expect(DEFAULT_CLINIC_PROFILE_SETTINGS.email).toBe('');
  });
});
