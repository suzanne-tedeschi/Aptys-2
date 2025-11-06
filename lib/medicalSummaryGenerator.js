/**
 * Génère un résumé médical PROFESSIONNEL structuré à partir des données du questionnaire
 * Format optimisé pour analyse par LLM médical (GPT-4o)
 * Calcule automatiquement les métriques clés (pack-years, critères NLST, etc.)
 */

/**
 * Calcule les paquets-années (pack-years) pour le tabagisme
 * @param {number} cigarettesPerDay - Nombre de cigarettes par jour
 * @param {number} smokingYears - Durée du tabagisme en années
 * @returns {number} Paquets-années (arrondi à 1 décimale)
 */
function calculatePackYears(cigarettesPerDay, smokingYears) {
  if (!cigarettesPerDay || !smokingYears) return 0;
  return Math.round((cigarettesPerDay * smokingYears / 20) * 10) / 10;
}

/**
 * Vérifie si le patient remplit les critères NLST pour dépistage cancer poumon
 * @param {number} age - Âge du patient
 * @param {number} packYears - Paquets-années
 * @param {boolean} isSmoker - Fumeur actif
 * @param {boolean} formerSmoker - Ex-fumeur
 * @param {number} quitYears - Années depuis arrêt (si ex-fumeur)
 * @returns {boolean}
 */
function meetsNLSTCriteria(age, packYears, isSmoker, formerSmoker, quitYears = 0) {
  if (age < 50 || age > 80) return false;
  if (packYears < 20) return false;
  if (isSmoker) return true;
  if (formerSmoker && quitYears < 15) return true;
  return false;
}

/**
 * Calcule l'âge au moment du diagnostic familial si possible
 * @param {number} patientAge - Âge actuel du patient
 * @param {number} relativeAge - Âge du parent (si vivant)
 * @param {number} diagnosisAge - Âge au diagnostic (si renseigné)
 * @returns {string}
 */
function calculateFamilialDiagnosisAge(relativeAge, diagnosisAge) {
  if (diagnosisAge) return `${diagnosisAge} ans`;
  if (relativeAge) return `Âge au diagnostic non précisé (parent actuellement ${relativeAge} ans)`;
  return 'Âge au diagnostic non précisé';
}

/**
 * @param {Object} formData - Données complètes du questionnaire
 * @returns {string} Résumé médical formaté en texte structuré PROFESSIONNEL
 */
export function generateMedicalSummary(formData) {
  const sections = [];
  
  // Variables calculées pour analyse
  const metrics = {
    packYears: 0,
    meetsNLST: false,
    bmiCategory: '',
    cvRiskFactorCount: 0
  };
  
  // Variables pour analyse familiale (déclarées ici pour être accessibles partout)
  let breastCancerFamilyCount = 0;
  let ovarianCancerFamilyCount = 0;
  let colonCancerFamilyCount = 0;
  let lungCancerFamilyCount = 0;
  let earlyOnsetCancer = false;

  // ============================================
  // 1. IDENTITÉ ET DONNÉES DÉMOGRAPHIQUES
  // ============================================
  sections.push(`=== PROFIL DU PATIENT ===`);
  sections.push(`Âge : ${formData.age || 'Non renseigné'} ans`);
  sections.push(`Sexe : ${formData.sex === 'female' ? 'Femme' : formData.sex === 'male' ? 'Homme' : 'Non renseigné'}`);
  
  if (formData.weight && formData.height) {
    sections.push(`Poids : ${formData.weight} kg`);
    sections.push(`Taille : ${formData.height} cm`);
    const bmi = parseFloat(formData.bmi);
    sections.push(`IMC : ${bmi.toFixed(1)}`);
    
    // Interprétation IMC PROFESSIONNELLE avec catégories OMS
    if (bmi < 16.5) {
      sections.push(`  → DÉNUTRITION SÉVÈRE (IMC <16.5) ⚠️ URGENCE`);
      metrics.bmiCategory = 'severe_underweight';
    } else if (bmi < 18.5) {
      sections.push(`  → Insuffisance pondérale (IMC 16.5-18.5) - Risque ostéoporose, anémie`);
      metrics.bmiCategory = 'underweight';
    } else if (bmi < 25) {
      sections.push(`  → Poids normal (IMC 18.5-25)`);
      metrics.bmiCategory = 'normal';
    } else if (bmi < 30) {
      sections.push(`  → Surpoids (IMC 25-30) - Risque CV modéré, prédiabète`);
      metrics.bmiCategory = 'overweight';
    } else if (bmi < 35) {
      sections.push(`  → Obésité modérée (IMC 30-35) - Risque CV élevé, diabète type 2`);
      metrics.bmiCategory = 'obese_class1';
    } else if (bmi < 40) {
      sections.push(`  → Obésité sévère (IMC 35-40) - Risque CV très élevé, bilan métabolique urgent`);
      metrics.bmiCategory = 'obese_class2';
    } else {
      sections.push(`  → Obésité morbide (IMC ≥40) ⚠️ Risque vital, chirurgie bariatrique à discuter`);
      metrics.bmiCategory = 'obese_class3';
    }
  }
  sections.push('');

  // ============================================
  // 2. HABITUDES DE VIE AVEC CALCULS AUTOMATIQUES
  // ============================================
  sections.push(`=== HABITUDES DE VIE ===`);
  
  // Tabagisme PROFESSIONNEL avec calcul pack-years
  if (formData.smoker) {
    sections.push(`Tabagisme : FUMEUR ACTIF`);
    
    if (formData.cigarettesPerDay && formData.smokingYears) {
      const packYears = calculatePackYears(formData.cigarettesPerDay, formData.smokingYears);
      metrics.packYears = packYears;
      
      sections.push(`  → Consommation : ${formData.cigarettesPerDay} cigarettes/jour`);
      sections.push(`  → Durée : ${formData.smokingYears} ans`);
      sections.push(`  → PAQUETS-ANNÉES : ${packYears} PA ⚠️`);
      
      // Interprétation clinique
      if (packYears >= 30) {
        sections.push(`  → TABAGISME TRÈS LOURD (≥30 PA) - Risque cancer poumon x20, BPCO quasi certain`);
      } else if (packYears >= 20) {
        sections.push(`  → Tabagisme lourd (≥20 PA) - Dépistage cancer poumon scanner low-dose recommandé`);
      } else if (packYears >= 10) {
        sections.push(`  → Tabagisme modéré (10-20 PA) - Risque CV et respiratoire significatif`);
      }
      
      // Critères NLST
      if (formData.age) {
        const nlst = meetsNLSTCriteria(formData.age, packYears, true, false);
        metrics.meetsNLST = nlst;
        if (nlst) {
          sections.push(`  → ✅ CRITÈRES NLST REMPLIS : Dépistage cancer poumon scanner low-dose ANNUEL recommandé (50-80 ans + ≥20 PA)`);
        }
      }
    } else {
      sections.push(`  → Détails non renseignés (calcul pack-years impossible)`);
    }
    
  } else if (formData.formerSmoker) {
    sections.push(`Tabagisme : EX-FUMEUR`);
    
    if (formData.cigarettesPerDay && formData.smokingYears) {
      const packYears = calculatePackYears(formData.cigarettesPerDay, formData.smokingYears);
      metrics.packYears = packYears;
      
      sections.push(`  → Consommation passée : ${formData.cigarettesPerDay} cigarettes/jour pendant ${formData.smokingYears} ans`);
      sections.push(`  → PAQUETS-ANNÉES : ${packYears} PA`);
      
      if (formData.quitDate) {
        const quitYears = new Date().getFullYear() - new Date(formData.quitDate).getFullYear();
        sections.push(`  → Arrêt : ${formData.quitDate} (il y a ${quitYears} ans)`);
        
        // Critères NLST pour ex-fumeurs
        if (formData.age && quitYears < 15 && packYears >= 20) {
          const nlst = meetsNLSTCriteria(formData.age, packYears, false, true, quitYears);
          metrics.meetsNLST = nlst;
          if (nlst) {
            sections.push(`  → ✅ CRITÈRES NLST REMPLIS : Arrêt <15 ans + ≥20 PA - Scanner low-dose recommandé`);
          }
        }
        
        // Bénéfice de l'arrêt
        if (quitYears >= 10) {
          sections.push(`  → Risque CV quasi normalisé après 10 ans d'arrêt`);
        } else if (quitYears >= 5) {
          sections.push(`  → Risque infarctus réduit de 50% après 5 ans d'arrêt`);
        } else {
          sections.push(`  → Bénéfice CV déjà mesurable (↓20% risque à 1 an)`);
        }
      }
    }
    
  } else {
    sections.push(`Tabagisme : NON-FUMEUR (facteur protecteur)`);
  }

  sections.push(`Consommation d'alcool : ${formData.alcohol || 'Non renseigné'}`);
  
  // Activité physique avec interprétation
  const activityLabels = {
    'sedentary': 'SÉDENTAIRE (<30 min/semaine) ⚠️ Risque CV +50%',
    'light': 'Légère (30-150 min/semaine) - Insuffisant selon OMS',
    'moderate': 'Modérée (150-300 min/semaine) - Conforme OMS',
    'vigorous': 'Intense (>300 min/semaine) - Optimal, risque CV ↓30%'
  };
  sections.push(`Activité physique : ${activityLabels[formData.physicalActivity] || formData.physicalActivity || 'Non renseigné'}`);
  
  sections.push(`Alimentation : ${formData.diet || 'Non renseigné'}`);
  sections.push('');

  // ============================================
  // 3. ANTÉCÉDENTS PERSONNELS
  // ============================================
  sections.push(`=== ANTÉCÉDENTS MÉDICAUX PERSONNELS ===`);
  
  // Maladies chroniques
  if (formData.chronicDiseases && formData.chronicDiseases.length > 0) {
    sections.push(`Maladies chroniques :`);
    formData.chronicDiseases.forEach(d => sections.push(`  - ${d}`));
  } else {
    sections.push(`Maladies chroniques : Aucune`);
  }

  // Chirurgies
  if (formData.pastSurgeries && formData.pastSurgeries.length > 0) {
    sections.push(`Chirurgies passées :`);
    formData.pastSurgeries.forEach(s => sections.push(`  - ${s}`));
  }

  // Médicaments actuels
  if (formData.currentMedications && formData.currentMedications.length > 0) {
    sections.push(`Médicaments actuels :`);
    formData.currentMedications.forEach(m => sections.push(`  - ${m}`));
  }

  // Allergies
  if (formData.allergies && formData.allergies.length > 0) {
    sections.push(`Allergies :`);
    formData.allergies.forEach(a => sections.push(`  - ${a}`));
  }
  sections.push('');

  // ============================================
  // 4. FACTEURS DE RISQUE CARDIOVASCULAIRE AVEC COMPTAGE
  // ============================================
  sections.push(`=== FACTEURS DE RISQUE CARDIOVASCULAIRE ===`);
  const cvRisks = [];
  
  if (formData.hypertension) {
    cvRisks.push('Hypertension artérielle (RR x2-3)');
    metrics.cvRiskFactorCount++;
  }
  if (formData.cholesterol) {
    cvRisks.push('Hypercholestérolémie (RR x2-4 selon LDL-C)');
    metrics.cvRiskFactorCount++;
  }
  if (formData.diabetes) {
    cvRisks.push('Diabète (RR x2-4, équivalent risque coronarien)');
    metrics.cvRiskFactorCount++;
  }
  if (formData.heartDisease) {
    cvRisks.push('Maladie cardiaque connue (PRÉVENTION SECONDAIRE)');
    metrics.cvRiskFactorCount++;
  }
  
  // Tabac comme facteur CV
  if (formData.smoker || (formData.formerSmoker && metrics.packYears >= 10)) {
    cvRisks.push(`Tabagisme actif ou récent (${metrics.packYears} PA, RR x2-3)`);
    metrics.cvRiskFactorCount++;
  }
  
  // Obésité comme facteur CV
  if (metrics.bmiCategory.includes('obese')) {
    cvRisks.push(`Obésité (IMC ≥30, RR x1.5-2)`);
    metrics.cvRiskFactorCount++;
  }
  
  // Sédentarité
  if (formData.physicalActivity === 'sedentary') {
    cvRisks.push(`Sédentarité (RR x1.5)`);
    metrics.cvRiskFactorCount++;
  }
  
  if (cvRisks.length > 0) {
    cvRisks.forEach(r => sections.push(`  - ${r}`));
    sections.push('');
    
    // ANALYSE DES SYNERGIES CARDIOVASCULAIRES
    if (metrics.cvRiskFactorCount >= 4) {
      sections.push(`⚠️⚠️⚠️ CUMUL MAJEUR : ${metrics.cvRiskFactorCount} FACTEURS DE RISQUE CV`);
      sections.push(`→ Risque CV TRÈS ÉLEVÉ (≥4 facteurs) - Équivalent PRÉVENTION SECONDAIRE`);
      sections.push(`→ Objectif LDL-C <55 mg/dL (<0.4 mmol/L) selon ESC 2021`);
      sections.push(`→ Calcul SCORE2 ou Framingham IMPÉRATIF + Bilan lipidique complet`);
    } else if (metrics.cvRiskFactorCount >= 3) {
      sections.push(`⚠️⚠️ CUMUL IMPORTANT : ${metrics.cvRiskFactorCount} FACTEURS DE RISQUE CV`);
      sections.push(`→ Risque CV ÉLEVÉ (3 facteurs) - Risque multiplicatif x4-8 vs population générale`);
      sections.push(`→ Objectif LDL-C <70 mg/dL selon risque calculé (SCORE2)`);
      sections.push(`→ Bilan CV complet recommandé : LDL-C, HDL-C, TG, Lp(a), HbA1c, TA`);
    } else if (metrics.cvRiskFactorCount >= 2) {
      sections.push(`⚠️ Présence de ${metrics.cvRiskFactorCount} facteurs de risque CV - Risque modéré à élevé`);
      sections.push(`→ Calcul SCORE2 recommandé pour stratification précise`);
    }
  } else {
    sections.push(`Aucun facteur de risque cardiovasculaire connu (facteur protecteur)`);
  }
  sections.push('');

  // ============================================
  // 5. ANTÉCÉDENTS FAMILIAUX AVEC ANALYSE DE RISQUE GÉNÉTIQUE
  // ============================================
  sections.push(`=== ANTÉCÉDENTS FAMILIAUX ===`);
  
  // Variables déjà déclarées en haut de la fonction
  // Côté maternel
  const maternal = formData.familyHistory?.maternal || {};
  sections.push(`\nCÔTÉ MATERNEL :`);
  
  if (maternal.cancer && maternal.cancer.length > 0) {
    sections.push(`  Cancers :`);
    maternal.cancer.forEach(c => {
      sections.push(`    - ${c}`);
      
      // Analyse du type de cancer pour risque génétique
      if (c.toLowerCase().includes('sein')) breastCancerFamilyCount++;
      if (c.toLowerCase().includes('ovaire')) ovarianCancerFamilyCount++;
      if (c.toLowerCase().includes('côlon') || c.toLowerCase().includes('colorectal')) colonCancerFamilyCount++;
      if (c.toLowerCase().includes('poumon')) lungCancerFamilyCount++;
      
      // Détection âge précoce si mentionné
      const ageMatch = c.match(/(\d{2})\s*ans/);
      if (ageMatch && parseInt(ageMatch[1]) < 50) {
        earlyOnsetCancer = true;
      }
    });
  }
  
  if (maternal.heartDisease) {
    sections.push(`  - Maladie cardiaque`);
    if (maternal.heartDiseaseAge && maternal.heartDiseaseAge < 55) {
      sections.push(`    → ⚠️ Âge précoce (<55 ans) - Facteur de risque majeur pour patient`);
    }
  }
  
  if (maternal.diabetes) sections.push(`  - Diabète (risque type 2 x2-3 pour patient)`);
  if (maternal.alzheimer) sections.push(`  - Maladie d'Alzheimer`);
  if (maternal.otherConditions) sections.push(`  Autres : ${maternal.otherConditions}`);
  
  if (!maternal.cancer?.length && !maternal.heartDisease && !maternal.diabetes && !maternal.alzheimer && !maternal.otherConditions) {
    sections.push(`  Aucun antécédent familial maternel renseigné`);
  }

  // Côté paternel
  const paternal = formData.familyHistory?.paternal || {};
  sections.push(`\nCÔTÉ PATERNEL :`);
  
  if (paternal.cancer && paternal.cancer.length > 0) {
    sections.push(`  Cancers :`);
    paternal.cancer.forEach(c => {
      sections.push(`    - ${c}`);
      
      // Analyse du type de cancer
      if (c.toLowerCase().includes('sein')) breastCancerFamilyCount++;
      if (c.toLowerCase().includes('ovaire')) ovarianCancerFamilyCount++;
      if (c.toLowerCase().includes('côlon') || c.toLowerCase().includes('colorectal')) colonCancerFamilyCount++;
      if (c.toLowerCase().includes('poumon')) lungCancerFamilyCount++;
      
      // Détection âge précoce
      const ageMatch = c.match(/(\d{2})\s*ans/);
      if (ageMatch && parseInt(ageMatch[1]) < 50) {
        earlyOnsetCancer = true;
      }
    });
  }
  
  if (paternal.heartDisease) {
    sections.push(`  - Maladie cardiaque`);
    if (paternal.heartDiseaseAge && paternal.heartDiseaseAge < 55) {
      sections.push(`    → ⚠️ Âge précoce (<55 ans) - Facteur de risque majeur pour patient`);
    }
  }
  
  if (paternal.diabetes) sections.push(`  - Diabète (risque type 2 x2-3 pour patient)`);
  if (paternal.alzheimer) sections.push(`  - Maladie d'Alzheimer`);
  if (paternal.otherConditions) sections.push(`  Autres : ${paternal.otherConditions}`);
  
  if (!paternal.cancer?.length && !paternal.heartDisease && !paternal.diabetes && !paternal.alzheimer && !paternal.otherConditions) {
    sections.push(`  Aucun antécédent familial paternel renseigné`);
  }
  
  sections.push('');
  
  // ============================================
  // ALERTE RISQUE GÉNÉTIQUE ÉLEVÉ
  // ============================================
  const geneticAlerts = [];
  
  // Critères BRCA (sein/ovaire)
  if (breastCancerFamilyCount >= 2 || (breastCancerFamilyCount >= 1 && ovarianCancerFamilyCount >= 1)) {
    geneticAlerts.push(`⚠️⚠️⚠️ ALERTE BRCA : ${breastCancerFamilyCount} cancer(s) sein + ${ovarianCancerFamilyCount} cancer(s) ovaire familiaux`);
    geneticAlerts.push(`→ Consultation oncogénétique URGENTE recommandée (critères Eisinger 2017)`);
    geneticAlerts.push(`→ Si mutation BRCA : Risque sein 60-80% lifetime, ovaire 40-60%`);
    if (formData.sex === 'female') {
      geneticAlerts.push(`→ Surveillance renforcée : IRM mammaire annuelle dès 30 ans + échographie ovarienne`);
    }
  } else if (breastCancerFamilyCount >= 1 && earlyOnsetCancer) {
    geneticAlerts.push(`⚠️ Antécédent familial cancer sein précoce (<50 ans) - Risque génétique possible`);
    geneticAlerts.push(`→ Surveillance sein renforcée : 10 ans avant âge cas index`);
  }
  
  // Lynch syndrome (côlon)
  if (colonCancerFamilyCount >= 2 || (colonCancerFamilyCount >= 1 && earlyOnsetCancer)) {
    geneticAlerts.push(`⚠️⚠️ Suspicion Lynch syndrome : ${colonCancerFamilyCount} cancer(s) colorectal familial`);
    geneticAlerts.push(`→ Consultation oncogénétique recommandée + Coloscopie dès 40 ans (ou 10 ans avant cas index)`);
    geneticAlerts.push(`→ Si Lynch : Risque colorectal 50-80%, endomètre 40-60% (femmes)`);
  }
  
  // Cancer poumon familial
  if (lungCancerFamilyCount >= 1 && metrics.packYears >= 10) {
    geneticAlerts.push(`⚠️ SYNERGIE : Tabagisme (${metrics.packYears} PA) + Antécédent familial cancer poumon = Risque x4-5`);
    geneticAlerts.push(`→ Dépistage scanner low-dose HAUTEMENT recommandé`);
  }
  
  if (geneticAlerts.length > 0) {
    sections.push(`=== ALERTES RISQUE GÉNÉTIQUE ÉLEVÉ ===`);
    geneticAlerts.forEach(a => sections.push(a));
    sections.push('');
  }
  sections.push('');

  // ============================================
  // 6. SANTÉ REPRODUCTIVE (Femmes)
  // ============================================
  if (formData.sex === 'female') {
    sections.push(`=== SANTÉ REPRODUCTIVE ===`);
    
    if (formData.pregnancies) {
      sections.push(`Nombre de grossesses : ${formData.pregnancies}`);
    } else {
      sections.push(`Nullipare (aucune grossesse)`);
    }

    if (formData.breastfeeding) {
      sections.push(`Allaitement : ${formData.breastfeeding} mois (total cumulé)`);
    }

    // Statut ménopausique
    if (formData.menopause === 'yes') {
      sections.push(`Statut ménopausique : Ménopausée`);
      if (formData.menopauseAge) {
        sections.push(`  → Âge de la ménopause : ${formData.menopauseAge} ans`);
        if (formData.menopauseAge < 45) {
          sections.push(`  → ⚠️ MÉNOPAUSE PRÉCOCE (risque ostéoporose accru)`);
        }
      }
      if (formData.hormonalTreatment) {
        sections.push(`  → Traitement hormonal substitutif (THS) : Oui`);
      }
    } else if (formData.menopause === 'no') {
      sections.push(`Statut ménopausique : Pré-ménopause`);
    }

    // Contraception hormonale
    if (formData.hormonalContraception) {
      const contraceptionLabels = {
        'never': 'Jamais utilisé de contraception hormonale',
        'past': 'Contraception hormonale dans le passé',
        'current_pill': 'Contraception hormonale actuelle (pilule)',
        'current_iud': 'Contraception hormonale actuelle (DIU hormonal)',
        'current_other': 'Contraception hormonale actuelle (autre)'
      };
      sections.push(`Contraception hormonale : ${contraceptionLabels[formData.hormonalContraception] || formData.hormonalContraception}`);
      
      if (formData.hormonalContraception !== 'never' && formData.hormonalContraceptionYears) {
        sections.push(`  → Durée totale : ${formData.hormonalContraceptionYears} ans`);
        if (formData.hormonalContraceptionYears >= 10) {
          sections.push(`  → ⚠️ Utilisation prolongée (≥10 ans)`);
        }
      }
    }
    sections.push('');
  }

  // ============================================
  // 7. DÉPISTAGES DÉJÀ EFFECTUÉS
  // ============================================
  sections.push(`=== DÉPISTAGES DÉJÀ RÉALISÉS ===`);
  const screenings = formData.screenings || {};
  
  const screeningLabels = {
    mammography: 'Mammographie',
    colonoscopy: 'Coloscopie',
    papSmear: 'Frottis cervical',
    bloodTest: 'Bilan sanguin',
    dentalVisit: 'Visite dentaire'
  };

  let hasScreenings = false;
  Object.entries(screenings).forEach(([key, value]) => {
    if (value && value.date) {
      hasScreenings = true;
      const label = screeningLabels[key] || key;
      sections.push(`  - ${label} : ${value.date}${value.reportUploaded ? ' (CR disponible)' : ''}`);
    }
  });

  if (!hasScreenings) {
    sections.push(`Aucun dépistage récent renseigné`);
  }
  sections.push('');

  // ============================================
  // 8. EXPOSITIONS ENVIRONNEMENTALES
  // ============================================
  sections.push(`=== EXPOSITIONS ENVIRONNEMENTALES ===`);
  
  if (formData.occupationalExposure && formData.occupationalExposure.length > 0) {
    sections.push(`Expositions professionnelles :`);
    formData.occupationalExposure.forEach(e => sections.push(`  - ${e}`));
  }

  sections.push(`Exposition solaire : ${formData.sunExposure || 'Non renseigné'}`);
  sections.push(`Statut vaccinal : ${formData.vaccinationStatus || 'Non renseigné'}`);
  
  if (formData.travelHistory) {
    sections.push(`Historique de voyages : ${formData.travelHistory}`);
  }
  sections.push('');

  // ============================================
  // 9. FOOTER AVEC MÉTRIQUES CALCULÉES
  // ============================================
  sections.push(`=== MÉTRIQUES CLÉS CALCULÉES (Pour analyse LLM) ===`);
  sections.push(`Pack-years tabagisme : ${metrics.packYears} PA`);
  sections.push(`Critères NLST (dépistage poumon) : ${metrics.meetsNLST ? 'OUI ✅' : 'NON'}`);
  sections.push(`Catégorie IMC : ${metrics.bmiCategory}`);
  sections.push(`Nombre facteurs risque CV : ${metrics.cvRiskFactorCount}`);
  sections.push(`Antécédents familiaux cancers sein : ${breastCancerFamilyCount}`);
  sections.push(`Antécédents familiaux cancers ovaire : ${ovarianCancerFamilyCount}`);
  sections.push(`Antécédents familiaux cancers côlon : ${colonCancerFamilyCount}`);
  sections.push('');
  
  sections.push(`=== FIN DU RÉSUMÉ MÉDICAL ===`);
  sections.push(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`);
  sections.push('');
  sections.push(`INSTRUCTIONS POUR GPT-4o :`);
  sections.push(`- Utiliser les MÉTRIQUES CALCULÉES ci-dessus pour les scores de risque`);
  sections.push(`- Si pack-years ≥20 + âge 50-80 → Appliquer critères NLST`);
  sections.push(`- Si cumul ≥3 facteurs CV → Calculer SCORE2 ou Framingham`);
  sections.push(`- Si cancer familial multiple → Analyser critères BRCA ou Lynch`);
  sections.push(`- TOUJOURS chiffrer les bénéfices (RRA, NNT) et citer guidelines précises`);

  return sections.join('\n');
}

/**
 * Génère une version simplifiée pour affichage utilisateur
 */
export function generatePatientFriendlySummary(formData) {
  return generateMedicalSummary(formData); // Même format pour l'instant
}
