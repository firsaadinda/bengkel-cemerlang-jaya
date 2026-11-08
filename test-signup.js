const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

supabase.auth.signUp({
  email: 'owner@bengkel.com',
  password: 'Bengkel123!'
}).then(r => {
  console.log('SignUp result:', r.error ? r.error : ('Success ID: ' + r.data.user.id));
}).catch(e => console.error(e));
