import { supabase } from '../../../../lib/supabase';

export default async function handler(req, res){
  const { id } = req.query;
  if(req.method !== 'POST') return res.status(405).end();
  
  const body = req.body || {};
  const { form, recommendations } = body;
  
  if (form) {
    // Sauvegarder ou mettre à jour les données personnelles
    const personalData = {
      user_id: id,
      age: form.age ? parseInt(form.age) : null,
      sex_at_birth: form.sex || null,
      is_smoker: !!form.smoker,
      bmi: form.bmi ? parseFloat(form.bmi) : null,
      is_draft: !recommendations, // false si on a des recommandations (soumission finale)
      submitted_at: recommendations ? new Date().toISOString() : null
    };
    
    const { error: personalError } = await supabase
      .from('user_personal_data')
      .upsert(personalData, { onConflict: 'user_id' });
    
    if (personalError) {
      console.error('Error saving personal data:', personalError);
      return res.status(500).json({ error: personalError.message });
    }
    
    // Sauvegarder les antécédents familiaux si présents
    if (form.familyHistory && Array.isArray(form.familyHistory) && form.familyHistory.length > 0) {
      // D'abord supprimer les anciens
      await supabase
        .from('family_medical_history')
        .delete()
        .eq('user_id', id);
      
      // Puis insérer les nouveaux
      const familyRecords = form.familyHistory
        .filter(item => item && item.trim())
        .map(condition => ({
          user_id: id,
          relationship: 'unknown', // À améliorer: parser ou demander la relation
          condition_type: condition.toLowerCase().replace(/\s+/g, '_'),
          condition_name: condition
        }));
      
      if (familyRecords.length > 0) {
        await supabase.from('family_medical_history').insert(familyRecords);
      }
    }
  }
  
  // Sauvegarder les recommandations si présentes
  if (recommendations && Array.isArray(recommendations)) {
    const recsToInsert = recommendations.map(r => ({
      user_id: id,
      recommendation_code: r.id,
      recommendation_name: r.name,
      interval_recommendation: r.interval,
      age_start: r.age_start,
      age_end: r.age_end,
      evidence_level: r.evidence_level,
      source_reference: r.source,
      reasoning: r.note || null,
      priority: 2
    }));
    
    const { error: recError } = await supabase
      .from('recommendations')
      .insert(recsToInsert);
    
    if (recError) {
      console.error('Error saving recommendations:', recError);
    }
  }
  
  res.json({ ok: true });
}
