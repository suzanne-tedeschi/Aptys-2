import { supabase } from '../../../lib/supabase';

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).end();
  
  const { language = 'fr' } = req.body || {};
  
  // Créer l'utilisateur dans Supabase
  const { data, error } = await supabase
    .from('users')
    .insert([{
      language,
      consent_given_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: error.message });
  }
  
  // Log dans audit
  await supabase.from('audit_logs').insert([{
    user_id: data.id,
    action_type: 'consent_given',
    action_details: { timestamp: new Date().toISOString(), language },
    ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  }]);
  
  res.json({ userId: data.id });
}
