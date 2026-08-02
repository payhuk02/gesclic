import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CLINIC_PROFILE_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  clinicSettingsService,
} from '@/services/clinic-settings.service';

describe('clinicSettingsService', () => {
  it('returns null for unknown clinic id', async () => {
    const profile = await clinicSettingsService.getClinicProfile('00000000-0000-0000-0000-000000000000');
    expect(profile).toBeNull();
  });

  it('exposes default settings constants', () => {
    expect(DEFAULT_CLINIC_PROFILE_SETTINGS.opening_hours.weekday).toBe('08:00 - 18:00');
    expect(DEFAULT_NOTIFICATION_SETTINGS.reminder24h).toBe(true);
    expect(DEFAULT_CLINIC_PROFILE_SETTINGS.notifications.emailNotif).toBe(true);
  });
});
