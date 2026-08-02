import { supabase } from '@/integrations/supabase/client';

export interface ClinicOpeningHours {
  weekday: string;
  saturday: string;
  sunday: string;
}

export interface ClinicProfileSettings {
  email: string;
  phone: string;
  address: string;
  country: string;
  website: string;
  opening_hours: ClinicOpeningHours;
}

export interface ClinicProfile {
  id: string;
  name: string;
  plan: string;
  logo_url: string | null;
  settings: ClinicProfileSettings;
}

const DEFAULT_OPENING_HOURS: ClinicOpeningHours = {
  weekday: '08:00 - 18:00',
  saturday: '08:00 - 13:00',
  sunday: 'Fermé',
};

export const DEFAULT_CLINIC_PROFILE_SETTINGS: ClinicProfileSettings = {
  email: '',
  phone: '',
  address: '',
  country: '',
  website: '',
  opening_hours: { ...DEFAULT_OPENING_HOURS },
};

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
      settings?: Partial<ClinicProfileSettings>;
    },
    existingSettings?: ClinicProfileSettings,
  ): Promise<void> {
    const current = existingSettings ?? DEFAULT_CLINIC_PROFILE_SETTINGS;
    const nextSettings = patch.settings
      ? {
          ...current,
          ...patch.settings,
          opening_hours: {
            ...current.opening_hours,
            ...(patch.settings.opening_hours ?? {}),
          },
        }
      : current;

    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name.trim();
    if (patch.logo_url !== undefined) payload.logo_url = patch.logo_url;
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
}

export const clinicSettingsService = new ClinicSettingsService();
