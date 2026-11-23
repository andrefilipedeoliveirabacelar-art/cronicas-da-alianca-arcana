import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or fallback to runtime sessionStorage
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const sessionUrl = sessionStorage.getItem('ARCANUM_SUPABASE_URL');
  const sessionKey = sessionStorage.getItem('ARCANUM_SUPABASE_ANON_KEY');

  const supabaseUrl = envUrl || sessionUrl || '';
  const supabaseAnonKey = envKey || sessionKey || '';

  return { supabaseUrl, supabaseAnonKey };
};

export const saveRuntimeCredentials = (url, key) => {
  if (url) sessionStorage.setItem('ARCANUM_SUPABASE_URL', url.trim());
  if (key) sessionStorage.setItem('ARCANUM_SUPABASE_ANON_KEY', key.trim());
};

export const hasValidCredentials = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return Boolean(
    supabaseUrl && 
    supabaseUrl.startsWith('http') && 
    supabaseAnonKey && 
    supabaseAnonKey.length > 10 &&
    !supabaseUrl.includes('your-project-id')
  );
};

let clientInstance = null;

export const getSupabase = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
    console.warn('[Supabase] Credenciais não configuradas ou usando placeholder. Configure o .env ou use o painel de conexão.');
  }

  // Reuse instance if config hasn't changed
  if (clientInstance && clientInstance.supabaseUrl === supabaseUrl) {
    return clientInstance;
  }

  const validUrl = (supabaseUrl && supabaseUrl.startsWith('http')) ? supabaseUrl : 'https://placeholder.supabase.co';
  const validKey = supabaseAnonKey || 'placeholder-anon-key';

  clientInstance = createClient(validUrl, validKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return clientInstance;
};

// Export direct proxy or client
export const supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getSupabase();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export default supabase;
