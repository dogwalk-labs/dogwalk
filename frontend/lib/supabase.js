import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dkjekpwchpsehjksjbyu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b1ABhNdnZczKyx2mVk8Flg_CDGxuHII";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
