import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res){
  if(req.method !== 'POST'){
    return res.status(405).end();
  }
  
  const { userId, ttlHours = 24 } = req.body || {};
  if(!userId) return res.status(400).json({ error: 'Missing userId' });
  
  const token = crypto.randomBytes(32).toString('hex'); // 64 caractères
  const expiresAt = new Date(Date.now() + (ttlHours * 3600 * 1000)).toISOString();
  
  const { data, error } = await supabase
    .from('share_links')
    .insert([{
      user_id: userId,
      share_token: token,
      expires_at: expiresAt,
      max_access_count: 5,
      created_by_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating share link:', error);
    return res.status(500).json({ error: error.message });
  }
  
  const url = `/api/share/${token}`;
  res.json({ url, token, expiresAt });
}
