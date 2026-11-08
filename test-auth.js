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

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('Testing Supabase URL:', url);
console.log('Anon key exists:', !!anonKey);

const supabase = createClient(url, anonKey);

async function testLogin(email) {
  const res = await supabase.auth.signInWithPassword({
    email,
    password: 'Bengkel123!'
  });
  if (res.error) {
    console.log(`Login ${email} FAILED:`, res.error.message);
  } else {
    console.log(`Login ${email} SUCCESS! User ID:`, res.data.user.id);
    const prof = await supabase.from('profiles').select('*').eq('id', res.data.user.id).single();
    console.log(`Profile ${email}:`, prof.data ? { nama: prof.data.nama, role: prof.data.role, aktif: prof.data.aktif } : prof.error);
  }
}

async function run() {
  await testLogin('owner@bengkel.com');
  await testLogin('sa@bengkel.com');
  await testLogin('kasir@bengkel.com');
  await testLogin('kepala@bengkel.com');
}

run();

