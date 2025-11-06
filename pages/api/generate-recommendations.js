import OpenAI from 'openai';
import { generateMedicalSummary } from '../../lib/medicalSummaryGenerator';
import { MEDICAL_SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from '../../lib/medicalPrompt';
import { supabase } from '../../lib/supabase';
import pdf from 'pdf-parse';
const { readEncryptedFile } = require('../../lib/storage');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, formData } = req.body;

    if (!userId || !formData) {
      return res.status(400).json({ error: 'userId and formData are required' });
    }

    // Vérifier que la clé API OpenAI est configurée
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(500).json({ 
        error: 'OPENAI_API_KEY not configured',
        message: 'Please add your OpenAI API key in .env.local'
      });
    }

    // ============================================
    // 1. GÉNÉRER LE RÉSUMÉ MÉDICAL + EXTRAITS DES PDF UPLOADÉS
    // ============================================
    console.log('📄 Génération du résumé médical...');
    let medicalSummary = generateMedicalSummary(formData);

    // Récupérer les documents uploadés pour cet utilisateur (si présents)
    try {
      const { data: docs, error: docsError } = await supabase
        .from('uploaded_documents')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (docsError) {
        console.warn('⚠️ Impossible de récupérer les documents uploadés:', docsError.message || docsError);
      } else if (docs && docs.length > 0) {
        console.log(`📎 Trouvé ${docs.length} document(s) uploadés pour l'utilisateur ${userId}`);

        let extractedSection = '\n=== COMPTE-RENDUS PDF (EXTRAITS AUTOMATIQUES) ===\n';

        for (const d of docs) {
          try {
            if (!d.storage_path) continue;

            // Préférer le fichier texte compagnon s'il existe (extrait sauvegardé à l'upload)
            const companionPath = `${d.storage_path}.txt`;
            let text = '';
            try {
              const companionBuf = readEncryptedFile(companionPath);
              if (companionBuf) {
                text = companionBuf.toString('utf8').trim();
              } else {
                // Si pas de compagnon, lire le fichier original et tenter extraction
                const buf = readEncryptedFile(d.storage_path);
                if (!buf) {
                  console.warn(`Fichier non trouvé en stockage local: ${d.storage_path}`);
                  continue;
                }

                if (d.mime_type && d.mime_type.includes('pdf')) {
                  try {
                    const parsed = await pdf(buf);
                    text = (parsed && parsed.text) ? parsed.text.trim() : '';
                  } catch (parseErr) {
                    console.warn(`Erreur extraction PDF pour ${d.original_filename}:`, parseErr.message || parseErr);
                    text = '';
                  }
                } else {
                  // Non-PDF — pas d'extraction automatique
                  text = '';
                }
              }
            } catch (readErr) {
              console.warn('Erreur lecture fichier compagnon/original :', readErr.message || readErr);
              text = '';
            }

            if (!text || text.length < 50) {
              extractedSection += `\n--- ${d.original_filename} (${d.screening_type || d.document_category || 'document'}) ---\n`;
              extractedSection += `[Aucun texte extrait automatiquement — document possible en image/scanné. Mettre en place OCR si nécessaire]\n\n`;
            } else {
              const excerpt = text.length > 12000 ? text.slice(0, 12000) + '\n...[truncated]' : text;
              extractedSection += `\n--- ${d.original_filename} (${d.screening_type || d.document_category || 'document'}) ---\n`;
              extractedSection += excerpt + '\n\n';
            }

          } catch (errDoc) {
            console.warn('Erreur pendant le traitement du document:', errDoc.message || errDoc);
            continue;
          }
        }

        medicalSummary += '\n' + extractedSection;
      }
    } catch (docFetchErr) {
      console.error('Erreur lors de la récupération/extraction des documents uploadés :', docFetchErr.message || docFetchErr);
    }
    
    // Log pour debug (optionnel - à retirer en production)
    console.log('--- RÉSUMÉ MÉDICAL GÉNÉRÉ ---');
    console.log(medicalSummary);
    console.log('--- FIN RÉSUMÉ ---\n');

    // ============================================
    // 2. APPELER OPENAI GPT-4o POUR ANALYSE
    // ============================================
    console.log('🤖 Appel de GPT-4o pour analyse médicale...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Meilleur modèle d'OpenAI (plus récent que gpt-4-turbo)
      response_format: { type: "json_object" }, // Force la réponse JSON
      temperature: 0.3, // Faible température pour cohérence médicale
      messages: [
        {
          role: 'system',
          content: MEDICAL_SYSTEM_PROMPT
        },
        {
          role: 'user',
          // On envoie le résumé médical augmenté des extraits de PDF (s'ils existent)
          content: USER_PROMPT_TEMPLATE(medicalSummary)
        }
      ]
    });

    // ============================================
    // 3. PARSER LA RÉPONSE JSON DE GPT-4o
    // ============================================
    console.log('📊 Parsing de la réponse...');
    
    const responseText = completion.choices[0].message.content;
    console.log('--- RÉPONSE BRUTE DE GPT-4o ---');
    console.log(responseText);
    console.log('--- FIN RÉPONSE ---\n');

    let gptResponse;
    try {
      gptResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erreur de parsing JSON:', parseError);
      console.error('Réponse brute:', responseText);
      
      return res.status(500).json({ 
        error: 'Failed to parse GPT-4o response',
        details: parseError.message,
        rawResponse: responseText
      });
    }

    // Validation de la structure
    if (!gptResponse.recommendations || !Array.isArray(gptResponse.recommendations)) {
      return res.status(500).json({ 
        error: 'Invalid response structure from GPT-4o',
        response: gptResponse
      });
    }

    // ============================================
    // 4. SAUVEGARDER DANS SUPABASE
    // ============================================
    console.log(`💾 Sauvegarde de ${gptResponse.recommendations.length} recommandations dans Supabase...`);

    const recommendationsToInsert = gptResponse.recommendations.map(rec => ({
      user_id: userId,
      recommendation_code: rec.id,
      recommendation_name: rec.name,
      interval_recommendation: rec.interval,
      age_start: rec.age_start || null,
      age_end: rec.age_end || null,
      evidence_level: rec.evidence_level,
      source_reference: rec.source,
      reasoning: rec.reasoning,
      priority: rec.priority || 3,
      engine_version: 'GPT-4o',
      is_active: true
    }));

    // Désactiver les anciennes recommandations pour cet utilisateur
    const { error: archiveError } = await supabase
      .from('recommendations')
      .update({ is_active: false, archived_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (archiveError) {
      console.error('⚠️ Erreur lors de l\'archivage des anciennes recommandations:', archiveError);
    }

    // Insérer les nouvelles recommandations
    const { data: insertedRecs, error: insertError } = await supabase
      .from('recommendations')
      .insert(recommendationsToInsert)
      .select();

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion des recommandations:', insertError);
      return res.status(500).json({ 
        error: 'Failed to save recommendations to database',
        details: insertError.message
      });
    }

    console.log(`✅ ${insertedRecs.length} recommandations sauvegardées avec succès`);

    // ============================================
    // 5. LOGGER DANS AUDIT
    // ============================================
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action_type: 'recommendations_generated',
      action_details: {
        model: 'gpt-4o',
        recommendations_count: gptResponse.recommendations.length,
        high_priority_count: gptResponse.recommendations.filter(r => r.priority >= 4).length,
        generated_at: new Date().toISOString(),
        tokens_used: completion.usage?.total_tokens || 0
      },
      status: 'success'
    });

    // ============================================
    // 6. RETOURNER LES RÉSULTATS
    // ============================================
    res.status(200).json({
      success: true,
      recommendations: insertedRecs,
      risk_summary: gptResponse.risk_summary,
      next_steps: gptResponse.next_steps,
      metadata: {
        total_count: insertedRecs.length,
        high_priority_count: insertedRecs.filter(r => r.priority >= 4).length,
        model_used: 'gpt-4o',
        generated_at: new Date().toISOString(),
        tokens_used: completion.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération des recommandations:', error);

    // Logger l'erreur dans audit
    if (req.body.userId) {
      await supabase.from('audit_logs').insert({
        user_id: req.body.userId,
        action_type: 'recommendations_generation_failed',
        action_details: {
          error_message: error.message,
          error_stack: error.stack
        },
        status: 'failure'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: error.stack
    });
  }
}
