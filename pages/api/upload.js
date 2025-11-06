import { saveEncryptedFile } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import pdf from 'pdf-parse';

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
  // Si PDF, tenter d'extraire le texte ET sauvegarder un fichier texte chiffré compagnon
  if ((req.body.mimeType || 'application/pdf').includes('pdf')) {
    try {
      const parsed = await pdf(buffer);
      const text = parsed && parsed.text ? parsed.text.trim() : '';
      if (text && text.length > 20) {
        const textPath = `${storagePath}.txt`;
        saveEncryptedFile(textPath, Buffer.from(text, 'utf8'));
        // stocker une petite indication dans la description pour retrouver le companion
        documentData.description = JSON.stringify({ extracted_text_path: textPath });
      } else {
        // texte trop court ou absent -> possible scan, on n'active pas l'OCR pour l'instant
        documentData.description = JSON.stringify({ extracted_text_path: null, note: 'no_text_extracted' });
      }
    } catch (err) {
      console.warn('Erreur extraction PDF à l\'upload:', err.message || err);
      documentData.description = JSON.stringify({ extracted_text_path: null, note: 'extraction_failed' });
    }
  }
  
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
