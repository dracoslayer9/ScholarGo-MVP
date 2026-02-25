const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upgradeUser() {
  const email = 'ahmadfirdaus0407@gmail.com';
  
  // 1. Get user from Auth
  console.log('Fetching user by email...');
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.log(`User with email ${email} not found in Auth!`);
    return;
  }
  
  console.log(`Found user: ${user.id}`);
  
  // 2. Update or insert profile
  const { error: updateError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      plan_type: 'plus',
      usage_pdf_analysis: 0,
      usage_chat: 0,
      usage_deep_review: 0,
      last_reset_date: new Date().toISOString()
    });
    
  if (updateError) {
    console.error('Profile update error:', updateError);
  } else {
    console.log('Successfully upgraded user to unlimited (plus) plan!');
  }
}

upgradeUser();
