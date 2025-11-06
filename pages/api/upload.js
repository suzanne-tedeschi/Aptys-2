import { saveEncryptedFile } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).end();
  
  const { userId, filename, data, documentCategory, screeningType, screeningDate } = req.body || {};
  if(!userId || !filename || !data) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  // Décoder le base64
  const buffer = Buffer.from(data, 'base64');
  const timestamp = Date.now();
  const storagePath = `uploads/${userId}/${timestamp}-${filename}`;
  
  // Sauvegarder le fichier chiffré localement
  saveEncryptedFile(storagePath, buffer);
  
  // Enregistrer les métadonnées dans Supabase
  const documentData = {
    user_id: userId,
    original_filename: filename,
    file_size_bytes: buffer.length,
    mime_type: req.body.mimeType || 'application/pdf',
    storage_path: storagePath,
    encryption_algorithm: 'AES-256-GCM',
    document_type: req.body.documentType || 'medical_document',
    document_category: documentCategory || 'other',
    uploaded_by_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  };
  
  // Ajouter les champs spécifiques aux comptes-rendus de dépistage
  if (screeningType) {
    documentData.screening_type = screeningType;
  }
  if (screeningDate) {
    documentData.screening_date = screeningDate;
  }
  
  const { data: doc, error } = await supabase
    .from('uploaded_documents')
    .insert([documentData])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving document metadata:', error);
    return res.status(500).json({ error: error.message });
  }
  
  return res.json({ ok: true, path: storagePath, documentId: doc.id });
}
