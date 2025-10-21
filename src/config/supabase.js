require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  throw new Error('Missing Supabase configuration');
}

console.log('🔌 Initializing Supabase client with URL:', supabaseUrl);

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        // Server-side rendering fix
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(key);
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
      },
    },
  },
};

const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
  }
}

testConnection();

module.exports = supabase;
