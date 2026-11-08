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
  }
}

async function run() {
  await testLogin('owner@cemerlangjaya.test');
  await testLogin('admin@cemerlangjaya.test');
  await testLogin('joko@cemerlangjaya.test');
  await testLogin('slamet@cemerlangjaya.test');
}

run();

