import { supabase } from '@/integrations/supabase/client';

export interface ClinicOpeningHours {
  weekday: string;
  saturday: string;
  sunday: string;
}

export interface ClinicNotificationSettings {
  smsReminder: boolean;
  whatsappReminder: boolean;
  emailNotif: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  resultReady: boolean;
}

export interface ClinicAppearanceSettings {
  primaryColor: string;
}

export interface ClinicProfileSettings {
  email: string;
  phone: string;
  address: string;
  country: string;
  website: string;
  opening_hours: ClinicOpeningHours;
  notifications: ClinicNotificationSettings;
  appearance: ClinicAppearanceSettings;
}

export interface ClinicProfile {
  id: string;
  name: string;
  plan: string;
  logo_url: string | null;
  settings: ClinicProfileSettings;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

const DEFAULT_OPENING_HOURS: ClinicOpeningHours = {
  weekday: '08:00 - 18:00',
  saturday: '08:00 - 13:00',
  sunday: 'Fermé',
};

export const DEFAULT_NOTIFICATION_SETTINGS: ClinicNotificationSettings = {
  smsReminder: false,
  whatsappReminder: false,
  emailNotif: true,
  reminder24h: true,
  reminder1h: false,
  resultReady: true,
};

export const DEFAULT_APPEARANCE_SETTINGS: ClinicAppearanceSettings = {
  primaryColor: '#0EA5E9',
};

export const DEFAULT_CLINIC_PROFILE_SETTINGS: ClinicProfileSettings = {
  email: '',
  phone: '',
  address: '',
  country: '',
  website: '',
  opening_hours: { ...DEFAULT_OPENING_HOURS },
  notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
  appearance: { ...DEFAULT_APPEARANCE_SETTINGS },
};

function parseNotifications(raw: unknown): ClinicNotificationSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    smsReminder: typeof obj.smsReminder === 'boolean' ? obj.smsReminder : DEFAULT_NOTIFICATION_SETTINGS.smsReminder,
    whatsappReminder: typeof obj.whatsappReminder === 'boolean' ? obj.whatsappReminder : DEFAULT_NOTIFICATION_SETTINGS.whatsappReminder,
    emailNotif: typeof obj.emailNotif === 'boolean' ? obj.emailNotif : DEFAULT_NOTIFICATION_SETTINGS.emailNotif,
    reminder24h: typeof obj.reminder24h === 'boolean' ? obj.reminder24h : DEFAULT_NOTIFICATION_SETTINGS.reminder24h,
    reminder1h: typeof obj.reminder1h === 'boolean' ? obj.reminder1h : DEFAULT_NOTIFICATION_SETTINGS.reminder1h,
    resultReady: typeof obj.resultReady === 'boolean' ? obj.resultReady : DEFAULT_NOTIFICATION_SETTINGS.resultReady,
  };
}

function parseAppearance(raw: unknown): ClinicAppearanceSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const color = typeof obj.primaryColor === 'string' ? obj.primaryColor : DEFAULT_APPEARANCE_SETTINGS.primaryColor;
  return { primaryColor: color.startsWith('#') ? color : DEFAULT_APPEARANCE_SETTINGS.primaryColor };
}

function parseSettings(raw: unknown): ClinicProfileSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const hours = (obj.opening_hours && typeof obj.opening_hours === 'object'
    ? obj.opening_hours
    : {}) as Record<string, unknown>;

  return {
    email: typeof obj.email === 'string' ? obj.email : '',
    phone: typeof obj.phone === 'string' ? obj.phone : '',
    address: typeof obj.address === 'string' ? obj.address : '',
    country: typeof obj.country === 'string' ? obj.country : '',
    website: typeof obj.website === 'string' ? obj.website : '',
    opening_hours: {
      weekday: typeof hours.weekday === 'string' ? hours.weekday : DEFAULT_OPENING_HOURS.weekday,
      saturday: typeof hours.saturday === 'string' ? hours.saturday : DEFAULT_OPENING_HOURS.saturday,
      sunday: typeof hours.sunday === 'string' ? hours.sunday : DEFAULT_OPENING_HOURS.sunday,
    },
    notifications: parseNotifications(obj.notifications),
    appearance: parseAppearance(obj.appearance),
  };
}

function mergeSettings(
  current: ClinicProfileSettings,
  patch: Partial<ClinicProfileSettings>,
): ClinicProfileSettings {
  return {
    ...current,
    ...patch,
    opening_hours: {
      ...current.opening_hours,
      ...(patch.opening_hours ?? {}),
    },
    notifications: {
      ...current.notifications,
      ...(patch.notifications ?? {}),
    },
    appearance: {
      ...current.appearance,
      ...(patch.appearance ?? {}),
    },
  };
}

export class ClinicSettingsService {
  async getClinicProfile(clinicId: string): Promise<ClinicProfile | null> {
    const { data, error } = await supabase
      .from('clinics')
      .select('id, name, plan, logo_url, settings')
      .eq('id', clinicId)
      .maybeSingle();

    if (error) {
      console.error('Error loading clinic profile:', error);
      throw new Error(error.message || 'Impossible de charger le profil clinique');
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      plan: data.plan,
      logo_url: data.logo_url,
      settings: parseSettings(data.settings),
    };
  }

  async updateClinicProfile(
    clinicId: string,
    patch: {
      name?: string;
      logo_url?: string | null;
      plan?: string;
      settings?: Partial<ClinicProfileSettings>;
    },
    existingSettings?: ClinicProfileSettings,
  ): Promise<void> {
    const current = existingSettings ?? DEFAULT_CLINIC_PROFILE_SETTINGS;
    const nextSettings = patch.settings ? mergeSettings(current, patch.settings) : current;

    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name.trim();
    if (patch.logo_url !== undefined) payload.logo_url = patch.logo_url;
    if (patch.plan !== undefined) payload.plan = patch.plan;
    if (patch.settings !== undefined) payload.settings = nextSettings;

    const { error } = await supabase
      .from('clinics')
      .update(payload)
      .eq('id', clinicId);

    if (error) {
      console.error('Error updating clinic profile:', error);
      if (error.code === '42501') {
        throw new Error('Seuls les administrateurs de la clinique peuvent modifier ces paramètres');
      }
      throw new Error(error.message || 'Impossible de sauvegarder le profil clinique');
    }
  }

  async updateClinicPlan(clinicId: string, plan: string): Promise<void> {
    const { error } = await supabase
      .from('clinics')
      .update({ plan })
      .eq('id', clinicId);

    if (error) {
      if (error.code === '42501') {
        throw new Error('Seuls les administrateurs de la clinique peuvent modifier le plan');
      }
      throw new Error(error.message || 'Impossible de mettre à jour le plan');
    }
  }

  async uploadClinicLogo(clinicId: string, file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Fichier image requis');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image max 2 Mo');
    }

    const ext = file.name.split('.').pop() || 'png';
    const path = `${clinicId}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('clinic-logos')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      throw new Error("Impossible d'uploader le logo");
    }

    const { data: signed, error: signError } = await supabase.storage
      .from('clinic-logos')
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (signError || !signed?.signedUrl) {
      throw new Error('Logo uploadé mais URL non générée');
    }

    return signed.signedUrl;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading user profile:', error);
      throw new Error(error.message || 'Impossible de charger le profil utilisateur');
    }

    if (!data) return null;

    return {
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      avatar_url: data.avatar_url,
    };
  }

  async updateUserProfile(userId: string, patch: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...(patch.first_name !== undefined ? { first_name: patch.first_name.trim() } : {}),
        ...(patch.last_name !== undefined ? { last_name: patch.last_name.trim() } : {}),
        ...(patch.avatar_url !== undefined ? { avatar_url: patch.avatar_url } : {}),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message || 'Impossible de sauvegarder le profil utilisateur');
    }
  }
}

export const clinicSettingsService = new ClinicSettingsService();
