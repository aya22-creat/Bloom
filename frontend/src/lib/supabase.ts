import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const createFallbackClient = () => {
  const chain = () => ({
    select: async () => ({ data: [], error: null, count: 0 }),
    eq: () => chain(),
    lte: () => chain(),
    or: () => chain(),
    order: () => chain(),
    range: () => chain(),
    single: async () => ({ data: null, error: null }),
    insert: () => chain(),
    not: () => chain(),
  });
  return { from: () => chain() } as any;
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createFallbackClient()
