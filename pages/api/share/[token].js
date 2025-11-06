import { supabase } from '../../../lib/supabase';

export default async function handler(req, res){
  const { token } = req.query;
  
  // Récupérer le lien de partage
  const { data: shareLink, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('share_token', token)
    .single();
  
  if(error || !shareLink) {
    return res.status(404).json({ error: 'Share link not found' });
  }
  
  // Vérifier l'expiration
  if(new Date(shareLink.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Share link expired' });
  }
  
  // Vérifier le nombre d'accès
  if(shareLink.access_count >= shareLink.max_access_count) {
    return res.status(403).json({ error: 'Maximum access count reached' });
  }
  
  // Vérifier si révoqué
  if(shareLink.revoked_at) {
    return res.status(403).json({ error: 'Share link has been revoked' });
  }
  
  // Incrémenter le compteur d'accès
  await supabase
    .from('share_links')
    .update({ 
      access_count: shareLink.access_count + 1,
      last_accessed_at: new Date().toISOString(),
      last_accessed_by_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    })
    .eq('share_token', token);
  
  // Retourner les informations
  return res.json({ 
    userId: shareLink.user_id, 
    expiresAt: shareLink.expires_at,
    accessesRemaining: shareLink.max_access_count - shareLink.access_count - 1
  });
}
