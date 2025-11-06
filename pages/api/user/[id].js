import { supabase } from '../../../lib/supabase';

export default async function handler(req, res){
  const { id } = req.query;
  
  if(req.method === 'GET'){
    // Récupérer toutes les données de l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if(userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Récupérer les données personnelles
    const { data: personalData } = await supabase
      .from('user_personal_data')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();
    
    // Récupérer les recommandations
    const { data: recommendations } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', id)
      .eq('is_active', true);
    
    return res.json({
      id: user.id,
      ...personalData,
      recommendations: recommendations || []
    });
  }

  if(req.method === 'DELETE'){
    // Suppression conforme RGPD (soft delete)
    const { error } = await supabase
      .from('users')
      .update({ 
        deleted_at: new Date().toISOString(),
        consent_withdrawn_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // Log audit
    await supabase.from('audit_logs').insert([{
      user_id: id,
      action_type: 'data_deleted',
      action_details: { deleted_at: new Date().toISOString() }
    }]);
    
    return res.json({ ok: true });
  }
  
  return res.status(405).end();
}
