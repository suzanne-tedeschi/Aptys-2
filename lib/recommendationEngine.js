// ============================================
// MOTEUR DE RECOMMANDATIONS PERSONNALISÉES
// Basé sur les guidelines HAS, INCa, ANSM (France)
// ============================================

/**
 * Génère des recommandations de dépistage personnalisées
 * @param {Object} input - Données complètes du questionnaire
 * @returns {Array} Liste de recommandations avec priorités
 */
function engine(input) {
  const recs = [];
  const age = Number(input.age || 0);
  const sex = (input.sex || '').toLowerCase();
  const bmi = Number(input.bmi || 0);
  
  // Tabagisme
  const isSmoker = !!input.smoker;
  const smokingPackYears = Number(input.smokingPackYears || 0);
  const isHeavySmoker = smokingPackYears >= 20; // Fort tabagisme
  
  // Facteurs cardiovasculaires
  const hasHypertension = !!input.hypertension;
  const hasCholesterol = !!input.cholesterol;
  const hasDiabetes = !!input.diabetes;
  const hasHeartDisease = !!input.heartDisease;
  
  // Antécédents familiaux
  const familyMaternal = input.familyHistory?.maternal || {};
  const familyPaternal = input.familyHistory?.paternal || {};
  
  // Santé reproductive (femmes)
  const pregnancies = Number(input.pregnancies || 0);
  const menopauseAge = Number(input.menopauseAge || 0);
  const hasHormonalTreatment = !!input.hormonalTreatment;
  const hormonalContraception = input.hormonalContraception || 'never';
  const hormonalContraceptionYears = Number(input.hormonalContraceptionYears || 0);
  
  // Dépistages déjà effectués
  const screenings = input.screenings || {};
  
  // ============================================
  // 1. DÉPISTAGES DES CANCERS
  // ============================================
  
  // === CANCER DU SEIN (Femmes) ===
  if (sex === 'female') {
    // Facteurs de risque
    const breastCancerFamily = [
      ...(familyMaternal.cancer || []),
      ...(familyPaternal.cancer || [])
    ].filter(c => c.toLowerCase().includes('sein')).length > 0;
    
    const hasOvarianCancerFamily = [
      ...(familyMaternal.cancer || []),
      ...(familyPaternal.cancer || [])
    ].filter(c => c.toLowerCase().includes('ovaire')).length > 0;
    
    const nulliparity = pregnancies === 0;
    const latePregnancy = pregnancies > 0 && age >= 35;
    const longContraception = hormonalContraceptionYears >= 10;
    
    // Dépistage standard (50-74 ans)
    if (age >= 50 && age <= 74) {
      recs.push({
        id: 'mammography-standard',
        name: 'Mammographie de dépistage',
        category: 'cancer',
        interval: 'Tous les 2 ans',
        age_start: 50,
        age_end: 74,
        priority: breastCancerFamily ? 5 : 4,
        evidence_level: 'Recommandation forte (HAS)',
        source: 'Dépistage organisé du cancer du sein (HAS)',
        reasoning: 'Dépistage organisé national pour toutes les femmes de 50 à 74 ans.',
        note: breastCancerFamily ? '⚠️ Antécédent familial détecté - surveillance renforcée recommandée' : null
      });
    }
    
    // Surveillance renforcée si risque élevé
    if (age >= 40 && (breastCancerFamily || hasOvarianCancerFamily)) {
      recs.push({
        id: 'mammography-high-risk',
        name: 'Surveillance renforcée du cancer du sein (haut risque)',
        category: 'cancer',
        interval: 'Annuelle - À discuter avec oncologue/généticien',
        age_start: 40,
        age_end: 75,
        priority: 5,
        evidence_level: 'Risque familial (INCa/HAS)',
        source: 'INCa - Surveillance des personnes à haut risque',
        reasoning: `Antécédent familial de cancer du sein/ovaires. Envisager consultation oncogénétique.`,
        note: '🔴 PRIORITÉ ÉLEVÉE - Consultation spécialisée recommandée'
      });
    }
    
    // Facteurs de risque modérés
    if (age >= 45 && age < 50 && (nulliparity || longContraception || hasHormonalTreatment)) {
      recs.push({
        id: 'mammography-moderate-risk',
        name: 'Mammographie avant 50 ans (facteurs de risque)',
        category: 'cancer',
        interval: 'À discuter avec votre médecin',
        age_start: 45,
        age_end: 50,
        priority: 3,
        evidence_level: 'Recommandation individuelle (HAS)',
        source: 'HAS - Facteurs de risque modérés',
        reasoning: `Facteurs de risque identifiés: ${nulliparity ? 'nulliparité, ' : ''}${longContraception ? 'contraception prolongée, ' : ''}${hasHormonalTreatment ? 'THS' : ''}`,
        note: null
      });
    }
  }
  
  // === CANCER DU COL DE L'UTÉRUS (Femmes) ===
  if (sex === 'female' && age >= 25 && age <= 65) {
    const interval = age <= 30 ? 'Tous les 3 ans (frottis)' : 'Tous les 5 ans (test HPV)';
    recs.push({
      id: 'cervical-screening',
      name: 'Dépistage du cancer du col de l\'utérus',
      category: 'cancer',
      interval: interval,
      age_start: 25,
      age_end: 65,
      priority: 4,
      evidence_level: 'Recommandation forte (HAS)',
      source: 'HAS - Dépistage organisé du cancer du col',
      reasoning: age <= 30 ? 
        'Frottis cervico-utérin tous les 3 ans après 2 frottis normaux à 1 an d\'intervalle.' :
        'Test HPV tous les 5 ans de 30 à 65 ans.',
      note: null
    });
  }
  
  // === CANCER COLORECTAL ===
  if (age >= 50 && age <= 74) {
    const hasColorectalFamily = [
      ...(familyMaternal.cancer || []),
      ...(familyPaternal.cancer || [])
    ].filter(c => c.toLowerCase().includes('colorectal') || c.toLowerCase().includes('côlon')).length > 0;
    
    if (hasColorectalFamily) {
      recs.push({
        id: 'colorectal-high-risk',
        name: 'Coloscopie de surveillance (risque familial)',
        category: 'cancer',
        interval: 'Tous les 5 ans ou selon avis du gastro-entérologue',
        age_start: 45,
        age_end: 75,
        priority: 5,
        evidence_level: 'Risque familial (HAS/SNFGE)',
        source: 'HAS/SNFGE - Surveillance personnes à risque',
        reasoning: 'Antécédent familial de cancer colorectal. Coloscopie recommandée plutôt que test FIT.',
        note: '⚠️ Antécédent familial - Coloscopie recommandée dès 45 ans'
      });
    } else {
      recs.push({
        id: 'colorectal-standard',
        name: 'Dépistage du cancer colorectal (Test FIT)',
        category: 'cancer',
        interval: 'Tous les 2 ans',
        age_start: 50,
        age_end: 74,
        priority: 4,
        evidence_level: 'Recommandation forte (HAS)',
        source: 'Dépistage organisé du cancer colorectal (HAS)',
        reasoning: 'Test immunologique fécal (FIT) tous les 2 ans. Si positif, coloscopie de diagnostic.',
        note: null
      });
    }
  }
  
  // === CANCER DU POUMON (Fumeurs) ===
  if (isSmoker && age >= 50 && age <= 75 && isHeavySmoker) {
    recs.push({
      id: 'lung-screening',
      name: 'Dépistage du cancer du poumon (scanner low-dose)',
      category: 'cancer',
      interval: 'Annuel - À discuter avec pneumologue',
      age_start: 50,
      age_end: 75,
      priority: 4,
      evidence_level: 'Recommandation pour fumeurs lourds (HAS)',
      source: 'HAS - Dépistage des fumeurs à risque élevé',
      reasoning: `Tabagisme important détecté (${smokingPackYears} paquets-années). Scanner thoracique low-dose peut être indiqué.`,
      note: '🚬 Accompagnement au sevrage tabagique fortement recommandé'
    });
  }
  
  // === CANCER DE LA PROSTATE (Hommes) ===
  if (sex === 'male' && age >= 50 && age <= 70) {
    const hasProstateCancerFamily = [
      ...(familyMaternal.cancer || []),
      ...(familyPaternal.cancer || [])
    ].filter(c => c.toLowerCase().includes('prostate')).length > 0;
    
    const priority = hasProstateCancerFamily ? 4 : 3;
    const startAge = hasProstateCancerFamily ? 45 : 50;
    
    recs.push({
      id: 'prostate-screening',
      name: 'Dépistage du cancer de la prostate (PSA + toucher rectal)',
      category: 'cancer',
      interval: 'Tous les 2-4 ans - Décision partagée avec le médecin',
      age_start: startAge,
      age_end: 70,
      priority: priority,
      evidence_level: 'Recommandation individuelle (HAS)',
      source: 'HAS - Dépistage du cancer de la prostate',
      reasoning: hasProstateCancerFamily ?
        'Antécédent familial de cancer de la prostate. Dépistage à discuter dès 45 ans.' :
        'Dépistage individualisé. Discuter des bénéfices/risques avec votre médecin.',
      note: hasProstateCancerFamily ? '⚠️ Risque familial - Début dès 45 ans' : 'Décision partagée médecin-patient'
    });
  }
  
  // ============================================
  // 2. DÉPISTAGES CARDIOVASCULAIRES
  // ============================================
  
  // === HYPERTENSION ARTÉRIELLE ===
  if (age >= 18) {
    const hasCVRisk = hasHypertension || hasCholesterol || hasDiabetes || isSmoker || bmi >= 30;
    recs.push({
      id: 'blood-pressure',
      name: 'Mesure de la tension artérielle',
      category: 'cardiovascular',
      interval: hasCVRisk ? 'À chaque consultation (au moins annuelle)' : 'Au moins tous les 3 ans',
      age_start: 18,
      age_end: 120,
      priority: hasCVRisk ? 4 : 3,
      evidence_level: 'Recommandation forte (HAS)',
      source: 'HAS - Prévention cardiovasculaire',
      reasoning: hasCVRisk ?
        'Facteurs de risque cardiovasculaire identifiés. Surveillance régulière recommandée.' :
        'Mesure systématique pour tous les adultes.',
      note: hasCVRisk ? '⚠️ Facteurs de risque CV présents' : null
    });
  }
  
  // === BILAN LIPIDIQUE ===
  if (age >= 40 || hasCholesterol || hasHeartDisease || hasDiabetes) {
    const hasFamilyCV = familyMaternal.heartDisease || familyPaternal.heartDisease;
    const priority = (hasCholesterol || hasHeartDisease || hasFamilyCV) ? 4 : 3;
    
    recs.push({
      id: 'lipid-profile',
      name: 'Bilan lipidique (cholestérol total, LDL, HDL, triglycérides)',
      category: 'cardiovascular',
      interval: hasCholesterol ? 'Annuel à tous les 3 ans selon traitement' : 'Tous les 5 ans',
      age_start: 40,
      age_end: 120,
      priority: priority,
      evidence_level: 'Recommandation (HAS)',
      source: 'HAS - Prévention cardiovasculaire',
      reasoning: hasFamilyCV ?
        'Antécédent familial de maladie cardiovasculaire. Bilan lipidique recommandé.' :
        'Dépistage de la dyslipidémie pour tous les adultes.',
      note: null
    });
  }
  
  // ============================================
  // 3. DÉPISTAGE MÉTABOLIQUE
  // ============================================
  
  // === DIABÈTE TYPE 2 ===
  const diabetesRiskFactors = [
    age >= 45,
    bmi >= 25,
    hasHypertension,
    hasCholesterol,
    familyMaternal.diabetes || familyPaternal.diabetes,
    sex === 'female' && pregnancies > 0 // Antécédent de diabète gestationnel possible
  ].filter(Boolean).length;
  
  if (diabetesRiskFactors >= 1) {
    const interval = diabetesRiskFactors >= 3 ? 'Annuel' : 'Tous les 3 ans';
    recs.push({
      id: 'diabetes-screening',
      name: 'Dépistage du diabète de type 2 (Glycémie à jeun et/ou HbA1c)',
      category: 'metabolic',
      interval: interval,
      age_start: 40,
      age_end: 120,
      priority: diabetesRiskFactors >= 3 ? 4 : 3,
      evidence_level: 'Recommandation (HAS)',
      source: 'HAS - Dépistage du diabète de type 2',
      reasoning: `${diabetesRiskFactors} facteur(s) de risque identifié(s): ${age >= 45 ? 'âge ≥45 ans, ' : ''}${bmi >= 25 ? 'surpoids/obésité, ' : ''}${hasHypertension ? 'HTA, ' : ''}${familyMaternal.diabetes || familyPaternal.diabetes ? 'antécédent familial' : ''}`,
      note: diabetesRiskFactors >= 3 ? '⚠️ Risque élevé de diabète' : null
    });
  }
  
  // ============================================
  // 4. SANTÉ OSSEUSE
  // ============================================
  
  // === OSTÉOPOROSE (Femmes ménopausées) ===
  if (sex === 'female' && (menopauseAge > 0 || age >= 65)) {
    const earlyMenopause = menopauseAge > 0 && menopauseAge < 45;
    const priority = earlyMenopause ? 4 : 3;
    
    recs.push({
      id: 'osteoporosis-screening',
      name: 'Dépistage de l\'ostéoporose (Ostéodensitométrie)',
      category: 'bone_health',
      interval: earlyMenopause ? 'À discuter dès la ménopause' : 'À partir de 65 ans ou si facteurs de risque',
      age_start: earlyMenopause ? menopauseAge : 65,
      age_end: 120,
      priority: priority,
      evidence_level: 'Recommandation (HAS)',
      source: 'HAS - Prévention de l\'ostéoporose',
      reasoning: earlyMenopause ?
        'Ménopause précoce détectée. Risque accru d\'ostéoporose.' :
        'Dépistage systématique chez les femmes ménopausées après 65 ans.',
      note: earlyMenopause ? '⚠️ Ménopause précoce - Risque ostéoporose' : null
    });
  }
  
  // ============================================
  // 5. SANTÉ DENTAIRE
  // ============================================
  
  if (age >= 3) {
    recs.push({
      id: 'dental-checkup',
      name: 'Examen dentaire et détartrage',
      category: 'dental',
      interval: 'Annuel (voire tous les 6 mois si pathologie)',
      age_start: 3,
      age_end: 120,
      priority: 3,
      evidence_level: 'Recommandation (UFSBD/HAS)',
      source: 'UFSBD - Prévention bucco-dentaire',
      reasoning: 'Examen dentaire régulier pour prévenir les caries et maladies parodontales.',
      note: isSmoker ? '🚬 Le tabac augmente le risque de maladies parodontales' : null
    });
  }
  
  // ============================================
  // 6. VACCINATIONS
  // ============================================
  
  // === RAPPELS DTP ===
  if (age >= 25) {
    const nextRecall = age >= 65 ? 'Tous les 10 ans' : 
                       age >= 25 && age < 65 ? 'À 25, 45, 65 ans puis tous les 10 ans' : 
                       'Selon calendrier vaccinal';
    
    recs.push({
      id: 'vaccination-dtp',
      name: 'Rappel vaccinal Diphtérie-Tétanos-Poliomyélite (dTP)',
      category: 'vaccination',
      interval: nextRecall,
      age_start: 25,
      age_end: 120,
      priority: 3,
      evidence_level: 'Calendrier vaccinal (Ministère de la Santé)',
      source: 'Calendrier vaccinal France',
      reasoning: 'Rappels réguliers pour maintenir l\'immunité.',
      note: null
    });
  }
  
  // === GRIPPE (≥65 ans ou facteurs de risque) ===
  if (age >= 65 || hasDiabetes || hasHeartDisease || isSmoker) {
    recs.push({
      id: 'flu-vaccine',
      name: 'Vaccination antigrippale',
      category: 'vaccination',
      interval: 'Annuelle (automne)',
      age_start: age >= 65 ? 65 : 18,
      age_end: 120,
      priority: age >= 65 ? 4 : 3,
      evidence_level: 'Recommandation (HAS)',
      source: 'HAS - Vaccination antigrippale',
      reasoning: age >= 65 ?
        'Vaccination recommandée pour toutes les personnes de 65 ans et plus.' :
        'Vaccination recommandée en raison de facteurs de risque.',
      note: null
    });
  }
  
  // ============================================
  // 7. EXAMENS OPHTALMOLOGIQUES
  // ============================================
  
  if (age >= 40 || hasDiabetes) {
    const interval = hasDiabetes ? 'Annuel (fond d\'œil)' :
                     age >= 60 ? 'Tous les 2 ans' :
                     'Tous les 5 ans';
    
    recs.push({
      id: 'eye-exam',
      name: 'Examen ophtalmologique',
      category: 'eye_health',
      interval: interval,
      age_start: 40,
      age_end: 120,
      priority: hasDiabetes ? 4 : 3,
      evidence_level: 'Recommandation (SFO)',
      source: 'Société Française d\'Ophtalmologie',
      reasoning: hasDiabetes ?
        'Diabète détecté. Fond d\'œil annuel pour dépister la rétinopathie diabétique.' :
        'Dépistage du glaucome, DMLA et autres pathologies oculaires.',
      note: hasDiabetes ? '⚠️ Diabète - Fond d\'œil annuel indispensable' : null
    });
  }
  
  // ============================================
  // FILTRAGE ET VALIDATION
  // ============================================
  
  // S'assurer que toutes les recommandations ont les champs requis
  const validated = recs.filter(r => r.interval && r.source && r.name);
  
  // Trier par priorité (5 = plus urgent)
  validated.sort((a, b) => b.priority - a.priority);
  
  return validated;
}

module.exports = { engine };
