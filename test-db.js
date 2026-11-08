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

async function checkTables() {
  const t1 = await supabase.from('workshop_settings').select('*');
  console.log('workshop_settings:', t1.data ? 'OK (count: ' + t1.data.length + ')' : t1.error);

  const t2 = await supabase.from('profiles').select('*');
  console.log('profiles:', t2.data ? 'OK (count: ' + t2.data.length + ')' : t2.error);

  const t3 = await supabase.from('inventory_items').select('*');
  console.log('inventory_items:', t3.data ? 'OK (count: ' + t3.data.length + ')' : t3.error);
}

checkTables();

