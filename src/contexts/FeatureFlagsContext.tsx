import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { featureFlagsService } from '@/services/featureFlags.service';

interface FeatureFlagsContextValue {
  loading: boolean;
  isEnabled: (key: string, defaultValue?: boolean) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

export const FeatureFlagsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setFlags({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await featureFlagsService.getAll();
      setFlags(Object.fromEntries(rows.map((row) => [row.key, row.enabled])));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback(
    (key: string, defaultValue = true) => flags[key] ?? defaultValue,
    [flags],
  );

  return (
    <FeatureFlagsContext.Provider value={{ loading, isEnabled, refresh }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return ctx;
};
