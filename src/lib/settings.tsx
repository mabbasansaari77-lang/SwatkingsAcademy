import { createContext, useContext, type ReactNode } from 'react';
import { supabase } from './supabase';
import { DEFAULT_SETTINGS } from './defaultSettings';
import type { SiteSettings } from './types';
import { useAsync } from './useAsync';

interface SettingsContextValue {
  settings: SiteSettings;
  loading: boolean;
  reload: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  reload: () => {},
});

async function loadSettings(): Promise<SiteSettings> {
  if (!supabase) return DEFAULT_SETTINGS;
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(data as SiteSettings) };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, loading, reload } = useAsync(loadSettings);
  return (
    <SettingsContext.Provider value={{ settings: data ?? DEFAULT_SETTINGS, loading, reload }}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  return useContext(SettingsContext);
}
