import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlagRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  enabled: boolean;
  rollout_percentage: number;
  environment: string;
  target_clinics: unknown;
  created_at: string;
  updated_at: string;
}

export class FeatureFlagsService {
  async getAll(): Promise<FeatureFlagRow[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading feature flags:', error);
      return [];
    }

    return (data ?? []) as FeatureFlagRow[];
  }

  async isEnabled(key: string, defaultValue = true): Promise<boolean> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) {
      return defaultValue;
    }

    return data.enabled;
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async create(flag: {
    key: string;
    name: string;
    description?: string;
    category?: string;
    enabled?: boolean;
  }): Promise<void> {
    const { error } = await supabase.from('feature_flags').insert({
      key: flag.key,
      name: flag.name,
      description: flag.description ?? null,
      category: flag.category ?? 'general',
      enabled: flag.enabled ?? false,
    });

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('feature_flags').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }
}

export const featureFlagsService = new FeatureFlagsService();
