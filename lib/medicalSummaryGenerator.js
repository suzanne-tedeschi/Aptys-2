/**
 * Fertility/PMA summary generator: builds a compact, structured summary string
 * tailored for the LLM prompt based on a specialized fertility intake.
 */

function toNumber(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : null;
}

function bmi(weightKg, heightCm) {
  const w = toNumber(weightKg);
  const h = toNumber(heightCm) ? toNumber(heightCm) / 100 : null;
  if (!w || !h || h <= 0) return null;
  return +(w / (h * h)).toFixed(1);
}

function yesNo(val) {
  if (val === true || val === 'yes' || val === 'oui') return 'oui';
  if (val === false || val === 'no' || val === 'non') return 'non';
  return 'non renseigné';
}

export function generateMedicalSummary(formData = {}) {
  const s = [];

  // =====================
  // Informations générales du couple
  // =====================
  const tryingStatus = formData.general_trying_status || 'non renseigné';
  const tryingMonths = toNumber(formData.general_trying_months);
  const freq = formData.general_frequency_intercourse_per_week || 'non renseigné';
  const sexualIssues = formData.general_sexual_difficulties || 'non';
  const ovuMethods = formData.general_ovulation_tracking_methods || 'non renseigné';
  const ovuRegular = yesNo(formData.general_ovulation_tracking_regular);
  const contraception = formData.general_contraception_method_before || 'non renseigné';
  const stopDate = formData.general_contraception_stop_date || 'non renseignée';
  const medSteps = formData.general_medical_steps || 'non';
  const priorTreatments = formData.general_prior_treatments || 'non';

  s.push('=== INFORMATIONS GÉNÉRALES DU COUPLE ===');
  s.push(`Statut: ${tryingStatus} | Durée d'essai: ${tryingMonths ?? 'non renseigné'} mois`);
  s.push(`Fréquence rapports: ${freq} | Difficultés sexuelles: ${sexualIssues}`);
  s.push(`Suivi ovulation: ${ovuMethods} | Ovulation détectée régulièrement: ${ovuRegular}`);
  s.push(`Contraception antérieure: ${contraception} | Date d'arrêt: ${stopDate}`);
  s.push(`Démarches/consultations déjà faites: ${medSteps}`);
  s.push(`Traitements fertilité déjà suivis: ${priorTreatments}`);
  s.push('');

  // =====================
  // Partenaire féminine
  // =====================
  const wAge = toNumber(formData.woman_age);
  const wH = toNumber(formData.woman_height_cm);
  const wW = toNumber(formData.woman_weight_kg);
  const wBMI = formData.woman_bmi ? toNumber(formData.woman_bmi) : bmi(wW, wH);
  const wGynHx = formData.woman_gyn_history || 'non';
  const wReg = yesNo(formData.woman_menstrual_regular);
  const wLen = toNumber(formData.woman_cycle_length_days);
  const wVar = formData.woman_cycle_variation || 'NR';
  const wFlow = formData.woman_period_flow || 'NR';
  const wDys = formData.woman_dysmenorrhea || 'non';
  const wPainTiming = formData.woman_pelvic_pain_timing || 'NR';
  const wPregCount = toNumber(formData.woman_pregnancies_count);
  const wChildren = toNumber(formData.woman_children_count);
  const wMC = toNumber(formData.woman_miscarriages_count);
  const wIVG = toNumber(formData.woman_abortions_count);
  const wPregNotes = formData.woman_pregnancies_details || '—';
  const wFam = formData.woman_family_history || '—';
  const wTreat = formData.woman_prior_fertility_treatments || '—';

  s.push('=== PROFIL PARTENAIRE FÉMININE ===');
  s.push(`Âge: ${wAge ?? 'NR'} | Taille/Poids: ${wH ?? 'NR'} cm / ${wW ?? 'NR'} kg | IMC: ${wBMI ?? 'NR'}`);
  s.push(`Antécédents gynéco/médicaux: ${wGynHx}`);
  s.push(`Cycles réguliers: ${wReg} | Durée moyenne: ${wLen ?? 'NR'} jours | Variation: ${wVar}`);
  s.push(`Flux menstruel: ${wFlow} | Dysménorrhée: ${wDys} | Timing douleur: ${wPainTiming}`);
  s.push(`Grossesses antérieures: ${wPregCount ?? 0} | Enfants nés vivants: ${wChildren ?? 0} | FC: ${wMC ?? 0} | IVG: ${wIVG ?? 0}`);
  s.push(`Détails grossesses: ${wPregNotes}`);
  s.push(`ATCD familiaux pertinents (femme): ${wFam}`);
  s.push(`Traitements fertilité déjà suivis (femme): ${wTreat}`);
  s.push('');

  // =====================
  // Partenaire masculin
  // =====================
  const mAge = toNumber(formData.man_age);
  const mH = toNumber(formData.man_height_cm);
  const mW = toNumber(formData.man_weight_kg);
  const mBMI = formData.man_bmi ? toNumber(formData.man_bmi) : bmi(mW, mH);
  const mHx = formData.man_medical_history || 'non';
  const mKids = toNumber(formData.man_children_biological_count);
  const mTreat = formData.man_treatments || '—';
  const mFam = formData.man_family_history || '—';

  s.push('=== PROFIL PARTENAIRE MASCULIN ===');
  s.push(`Âge: ${mAge ?? 'NR'} | Taille/Poids: ${mH ?? 'NR'} cm / ${mW ?? 'NR'} kg | IMC: ${mBMI ?? 'NR'}`);
  s.push(`Antécédents médicaux/andrologiques: ${mHx}`);
  s.push(`Fertilité prouvée antérieurement (enfants biologiques): ${mKids ?? 0}`);
  s.push(`Traitements/évaluations (homme): ${mTreat}`);
  s.push(`ATCD familiaux pertinents (homme): ${mFam}`);
  s.push('');

  // =====================
  // Mode de vie & expositions
  // =====================
  const smW = toNumber(formData.lifestyle_smoking_woman_cigs_per_day);
  const smM = toNumber(formData.lifestyle_smoking_man_cigs_per_day);
  const alcW = formData.lifestyle_alcohol_woman || 'NR';
  const alcM = formData.lifestyle_alcohol_man || 'NR';
  const drugW = formData.lifestyle_drugs_woman || 'NR';
  const drugM = formData.lifestyle_drugs_man || 'NR';
  const cafW = toNumber(formData.lifestyle_caffeine_woman_cups_per_day);
  const cafM = toNumber(formData.lifestyle_caffeine_man_cups_per_day);
  const diet = formData.lifestyle_diet || 'NR';
  const supW = formData.lifestyle_supplements_woman || 'NR';
  const supM = formData.lifestyle_supplements_man || 'NR';
  const actW = formData.lifestyle_activity_woman || 'NR';
  const actM = formData.lifestyle_activity_man || 'NR';
  const sleepHrs = toNumber(formData.lifestyle_sleep_hours);
  const sleepQual = formData.lifestyle_sleep_quality || 'NR';
  const stress = formData.lifestyle_stress_level || 'NR';
  const stressNotes = formData.lifestyle_stress_notes || '—';
  const exposure = formData.lifestyle_exposure || 'NR';

  s.push('=== MODE DE VIE & EXPOSITIONS ===');
  s.push(`Tabac (femme/homme): ${smW ?? 0} / ${smM ?? 0} cigarettes/jour`);
  s.push(`Alcool (femme/homme): ${alcW} / ${alcM}`);
  s.push(`Substances/Médicaments (femme/homme): ${drugW} / ${drugM}`);
  s.push(`Caféine (femme/homme): ${cafW ?? 0} / ${cafM ?? 0} boissons/jour`);
  s.push(`Alimentation: ${diet}`);
  s.push(`Suppléments (femme/homme): ${supW} / ${supM}`);
  s.push(`Activité physique (femme/homme): ${actW} / ${actM}`);
  s.push(`Sommeil: ${sleepHrs ?? 'NR'}h/nuit | Qualité: ${sleepQual}`);
  s.push(`Stress: ${stress} | Contexte: ${stressNotes}`);
  s.push(`Expositions pro/env.: ${exposure}`);
  s.push('');

  // =====================
  // Examens médicaux
  // =====================
  const fsh = toNumber(formData.labs_female_fsh);
  const lh = toNumber(formData.labs_female_lh);
  const e2 = toNumber(formData.labs_female_e2);
  const amh = toNumber(formData.labs_female_amh);
  const tsh = toNumber(formData.labs_female_tsh);
  const prol = toNumber(formData.labs_female_prolactin);
  const prog = toNumber(formData.labs_female_progesterone_day21);
  const echo = formData.imaging_ultrasound_notes || 'NR';
  const hsg = formData.imaging_hsg_result || 'NR';
  const otherF = formData.imaging_other || '—';

  const vol = toNumber(formData.spermo_volume_ml);
  const conc = toNumber(formData.spermo_concentration_million_per_ml);
  const mot = toNumber(formData.spermo_progressive_motility_percent);
  const morph = toNumber(formData.spermo_normal_morphology_percent);
  const spermoOther = formData.spermo_other_observations || '—';
  const mTesto = toNumber(formData.labs_male_testosterone);
  const mFSH = toNumber(formData.labs_male_fsh);
  const mLH = toNumber(formData.labs_male_lh);
  const tEcho = formData.imaging_testicular_ultrasound || '—';
  const otherM = formData.male_other_tests || '—';

  s.push('=== EXAMENS MÉDICAUX ===');
  s.push(`Bilan hormonal (femme) J3: FSH ${fsh ?? 'NR'} mUI/mL | LH ${lh ?? 'NR'} | E2 ${e2 ?? 'NR'} pg/mL | AMH ${amh ?? 'NR'} ng/mL`);
  s.push(`Thyroïde/Prolactine (femme): TSH ${tsh ?? 'NR'} mUI/L | Prolactine ${prol ?? 'NR'} ng/mL`);
  s.push(`Progestérone phase lutéale (~J21): ${prog ?? 'NR'} ng/mL`);
  s.push(`Échographie pelvienne: ${echo}`);
  s.push(`Hystérosalpingographie: ${hsg}`);
  s.push(`Autres examens femme: ${otherF}`);
  s.push(`Spermogramme: Volume ${vol ?? 'NR'} mL | Concentration ${conc ?? 'NR'} M/mL | Motilité prog. ${mot ?? 'NR'}% | Morphologie normale ${morph ?? 'NR'}%`);
  s.push(`Autres observations sperme: ${spermoOther}`);
  s.push(`Bilan hormonal homme: Testostérone ${mTesto ?? 'NR'} ng/dL | FSH ${mFSH ?? 'NR'} | LH ${mLH ?? 'NR'}`);
  s.push(`Échographie testiculaire: ${tEcho}`);
  s.push(`Autres examens homme: ${otherM}`);
  s.push('');

  // =====================
  // Commentaires libres
  // =====================
  if (formData.additional_comments) {
    s.push('=== COMMENTAIRES SUPPLÉMENTAIRES ===');
    s.push(String(formData.additional_comments));
    s.push('');
  }

  // =====================
  // Indicateurs utiles
  // =====================
  const flags = [];
  if (tryingStatus === 'trying' && Number.isFinite(tryingMonths)) {
    if (wAge != null && wAge >= 35 && tryingMonths >= 6) flags.push('Critère consult. rapide: femme ≥35 ans et essais ≥6 mois');
    if ((wAge == null || wAge < 35) && tryingMonths >= 12) flags.push('Critère consult.: essais ≥12 mois (<35 ans)');
  }
  if (flags.length) {
    s.push('=== DÉLAIS/CRITÈRES CLÉS ===');
    flags.forEach(f => s.push(`• ${f}`));
  }

  return s.join('\n');
}

