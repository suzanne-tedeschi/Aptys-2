import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function readQuery() {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  return { userId: p.get('userId') };
}

export default function Intake() {
  const router = useRouter();
  const q = readQuery();
  const [userId, setUserId] = useState(q.userId || '');
  const [form, setForm] = useState({
    // Contexte couple
    general_trying_status: 'trying',
    general_trying_months: '',
    general_frequency_intercourse_per_week: '',
    general_sexual_difficulties: '',
    general_ovulation_tracking_methods: '',
    general_ovulation_tracking_regular: '',
    general_contraception_method_before: '',
    general_contraception_stop_date: '',
    general_medical_steps: '',
    general_prior_treatments: '',

    // Partenaire feminine
    woman_age: '',
    woman_height_cm: '',
    woman_weight_kg: '',
    woman_bmi: '',
    woman_gyn_history: '',
    woman_menstrual_regular: '',
    woman_cycle_length_days: '',
    woman_cycle_variation: '', // New: Variation des cycles
    woman_period_flow: '', // New: Abondance des règles
    woman_pelvic_pain_timing: [], // New: Timing des douleurs
    woman_dysmenorrhea: '',
    woman_pregnancies_count: '',
    woman_children_count: '',
    woman_miscarriages_count: '',
    woman_abortions_count: '',
    woman_pregnancies_details: '',
    woman_family_history: '',
    woman_prior_fertility_treatments: '',

    // Partenaire masculine
    man_age: '',
    man_height_cm: '',
    man_weight_kg: '',
    man_bmi: '',
    man_medical_history: '',
    man_children_biological_count: '',
    man_treatments: '',
    man_family_history: '',

    // Mode de vie
    lifestyle_smoking_woman_cigs_per_day: '',
    lifestyle_smoking_man_cigs_per_day: '',
    lifestyle_alcohol_woman: '',
    lifestyle_alcohol_man: '',
    lifestyle_drugs_woman: '',
    lifestyle_drugs_man: '',
    lifestyle_caffeine_woman_cups_per_day: '',
    lifestyle_caffeine_man_cups_per_day: '',
    lifestyle_diet: '',
    lifestyle_supplements_woman: '',
    lifestyle_supplements_man: '',
    lifestyle_activity_woman: '',
    lifestyle_activity_man: '',
    lifestyle_sleep_hours: '', // New
    lifestyle_sleep_quality: '', // New
    lifestyle_stress_level: '',
    lifestyle_stress_notes: '',
    lifestyle_exposure: '',

    // Examens femme
    labs_female_fsh: '',
    labs_female_lh: '',
    labs_female_e2: '',
    labs_female_amh: '',
    labs_female_tsh: '',
    labs_female_prolactin: '',
    labs_female_progesterone_day21: '',
    imaging_ultrasound_notes: '',
    imaging_hsg_result: '',
    imaging_other: '',

    // Examens homme
    spermo_volume_ml: '',
    spermo_concentration_million_per_ml: '',
    spermo_progressive_motility_percent: '',
    spermo_normal_morphology_percent: '',
    spermo_other_observations: '',
    labs_male_testosterone: '',
    labs_male_fsh: '',
    labs_male_lh: '',
    imaging_testicular_ultrasound: '',
    male_other_tests: '',

    // Commentaires
    additional_comments: ''
  });

  useEffect(() => { if (q.userId) setUserId(q.userId); }, []);

  // IMC auto
  useEffect(() => {
    const w = parseFloat(form.woman_weight_kg);
    const h = parseFloat(form.woman_height_cm) / 100;
    if (w > 0 && h > 0) {
      const calc = (w / (h * h)).toFixed(1);
      setForm(prev => ({ ...prev, woman_bmi: calc }));
    }
  }, [form.woman_weight_kg, form.woman_height_cm]);

  useEffect(() => {
    const w = parseFloat(form.man_weight_kg);
    const h = parseFloat(form.man_height_cm) / 100;
    if (w > 0 && h > 0) {
      const calc = (w / (h * h)).toFixed(1);
      setForm(prev => ({ ...prev, man_bmi: calc }));
    }
  }, [form.man_weight_kg, form.man_height_cm]);

  function fillTestProfile() {
    setForm({
      ...form,
      // Contexte couple
      general_trying_status: 'trying',
      general_trying_months: '14',
      general_frequency_intercourse_per_week: '2-3',
      general_sexual_difficulties: 'Non',
      general_ovulation_tracking_methods: 'Tests LH occasionnels',
      general_ovulation_tracking_regular: 'oui',
      general_contraception_method_before: 'Pilule pendant 8 ans',
      general_contraception_stop_date: '2023-06-15',
      general_medical_steps: 'Consultation gynéco ville, échographie pelvienne',
      general_prior_treatments: 'Aucun',

      // Partenaire feminine (32 ans, cycles un peu longs, fumeuse occasionnelle)
      woman_age: '32',
      woman_height_cm: '165',
      woman_weight_kg: '62',
      woman_bmi: '22.8',
      woman_gyn_history: 'Kyste ovarien fonctionnel en 2020, pas d\'endométriose connue.',
      woman_menstrual_regular: 'non',
      woman_cycle_length_days: '34',
      woman_cycle_variation: '+/- 4',
      woman_period_flow: 'medium',
      woman_pelvic_pain_timing: '1er jour des règles',
      woman_dysmenorrhea: '3',
      woman_pregnancies_count: '0',
      woman_children_count: '0',
      woman_miscarriages_count: '0',
      woman_abortions_count: '0',
      woman_pregnancies_details: '',
      woman_family_history: 'Mère ménopausée à 48 ans.',
      woman_prior_fertility_treatments: '',

      // Partenaire masculine (35 ans, fumeur, spermogramme limite)
      man_age: '35',
      man_height_cm: '180',
      man_weight_kg: '85',
      man_bmi: '26.2',
      man_medical_history: 'Opération hernie inguinale enfant.',
      man_children_biological_count: '0',
      man_treatments: '',
      man_family_history: 'Père diabète type 2.',

      // Mode de vie
      lifestyle_smoking_woman_cigs_per_day: '2',
      lifestyle_smoking_man_cigs_per_day: '8',
      lifestyle_alcohol_woman: 'occasionnel',
      lifestyle_alcohol_man: 'modéré',
      lifestyle_drugs_woman: 'non',
      lifestyle_drugs_man: 'non',
      lifestyle_caffeine_woman_cups_per_day: '2',
      lifestyle_caffeine_man_cups_per_day: '4',
      lifestyle_diet: 'Équilibrée mais repas rapides le midi.',
      lifestyle_supplements_woman: 'Acide folique',
      lifestyle_supplements_man: '',
      lifestyle_activity_woman: 'modérée',
      lifestyle_activity_man: 'sédentaire',
      lifestyle_sleep_hours: '7',
      lifestyle_sleep_quality: 'good',
      lifestyle_stress_level: 'modéré',
      lifestyle_stress_notes: 'Travail stressant pour lui.',
      lifestyle_exposure: 'Lui: chaleur (cuisinier)',

      // Examens femme (AMH correcte, TSH un peu haute)
      labs_female_fsh: '6.5',
      labs_female_lh: '4.2',
      labs_female_e2: '45',
      labs_female_amh: '2.1',
      labs_female_tsh: '3.2', // Un peu haut pour fertilité (<2.5 idéal)
      labs_female_prolactin: '15',
      labs_female_progesterone_day21: '',
      imaging_ultrasound_notes: 'Ovaires aspect normal, compte folliculaire 12 à droite, 10 à gauche.',
      imaging_hsg_result: '',
      imaging_other: '',

      // Examens homme (Spermogramme un peu faible)
      spermo_volume_ml: '2.5',
      spermo_concentration_million_per_ml: '18', // Limite basse
      spermo_progressive_motility_percent: '35', // Limite
      spermo_normal_morphology_percent: '3', // Un peu bas (<4%)
      spermo_other_observations: '',
      labs_male_testosterone: '',
      labs_male_fsh: '',
      labs_male_lh: '',
      imaging_testicular_ultrasound: '',
      male_other_tests: '',

      additional_comments: 'Nous sommes motivés pour arrêter de fumer.'
    });
  }

  async function submit() {
    if (!userId) { alert('Missing userId'); return; }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.35);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `
      <div style="background:#ffffff;padding:2rem;border-radius:12px;text-align:center;max-width:520px;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
        <div style="width:48px;height:48px;border-radius:50%;margin:0 auto 1rem;background:#e6f0ff;display:flex;align-items:center;justify-content:center;">
          <div style="width:20px;height:20px;border:3px solid #0066cc;border-top-color:transparent;border-radius:50%;animation:spin 0.9s linear infinite;"></div>
        </div>
        <h3 style="margin-bottom:0.5rem;color:#1e293b;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;">Analyse clinique en cours…</h3>
        <p style="color:#475569;margin-bottom:1.5rem;font-size:0.95rem;font-family:'Inter',sans-serif;">
          Traitement sécurisé de vos données et génération du protocole personnalisé.
        </p>
        <div style="width:100%;height:4px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
          <div style="width:30%;height:100%;background:#0066cc;animation:loading 1.8s ease-in-out infinite;"></div>
        </div>
        <style>
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes loading {
            0% { width: 28%; margin-left: 0%; }
            50% { width: 55%; margin-left: 22%; }
            100% { width: 28%; margin-left: 70%; }
          }
        </style>
      </div>
    `;
    document.body.appendChild(overlay);

    try {
      await fetch(`/api/user/${userId}/draft`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form, is_draft: false })
      });

      const res = await fetch('/api/generate-recommendations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, formData: form })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la génération des recommandations');
      }

      const json = await res.json();
      document.body.removeChild(overlay);
      alert(`Recommandations générées : ${json.metadata.total_count}`);
      router.push(`/dashboard?userId=${userId}`);
    } catch (error) {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      console.error('Erreur lors de la soumission:', error);
      alert(`Erreur: ${error.message}`);
    }
  }

  return (
    <div className="intake-shell">
      <div className="intake-hero">
        <div className="intake-hero__badge" onClick={fillTestProfile} style={{cursor: 'pointer'}} title="Remplir profil test">Espace Confidentiel</div>
        <h1>Votre bilan fertilité</h1>
        <p>Prenez le temps de répondre à ces questions. Vos réponses nous permettent de construire une stratégie médicale adaptée à votre couple.</p>
        <div className="intake-hero__pills">
          <span className="pill">Couple</span>
          <span className="pill">Biologie</span>
          <span className="pill">Mode de vie</span>
        </div>
      </div>

      <div className="intake-grid">
        <div className="intake-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Étape 1</p>
              <h2>Contexte du couple</h2>
              <p className="muted">Commençons par comprendre où vous en êtes dans votre projet.</p>
            </div>
          </div>

          <div className="info-banner">
            <span style={{fontSize: '1.2rem'}}>👋</span>
            <div>
              <strong>Bienvenue :</strong> Remplissez ce formulaire ensemble si possible.<br/>
              Soyez le plus précis possible pour une analyse fiable.
            </div>
          </div>

          <label>
            Statut du projet bébé
            <select value={form.general_trying_status} onChange={e => setForm({ ...form, general_trying_status: e.target.value })}>
              <option value="trying">Nous essayons actuellement</option>
              <option value="planning">Préparation (pas d’essais encore)</option>
            </select>
          </label>
          <div className="input-grid">
            <label>Durée d’essais
              <div className="input-wrapper">
                <input type="number" placeholder="Ex: 12" value={form.general_trying_months} onChange={e => setForm({ ...form, general_trying_months: e.target.value })} />
                <span className="input-unit">mois</span>
              </div>
            </label>
            <label>Fréquence des rapports
              <div className="input-wrapper">
                <input type="text" placeholder="Ex: 2-3" value={form.general_frequency_intercourse_per_week} onChange={e => setForm({ ...form, general_frequency_intercourse_per_week: e.target.value })} />
                <span className="input-unit">/semaine</span>
              </div>
            </label>
          </div>
          <label>Difficultés sexuelles (érection, libido, douleurs)<input type="text" placeholder="Ex: Douleurs pendant les rapports, baisse de libido..." value={form.general_sexual_difficulties} onChange={e => setForm({ ...form, general_sexual_difficulties: e.target.value })} /></label>
          <div className="input-grid">
            <label>Suivi de l’ovulation (méthodes + constat)<input type="text" value={form.general_ovulation_tracking_methods} onChange={e => setForm({ ...form, general_ovulation_tracking_methods: e.target.value })} placeholder="Ex: Tests LH positifs à J14, courbe de température..." /></label>
            <label>Ovulation détectée régulièrement ?
              <select value={form.general_ovulation_tracking_regular} onChange={e => setForm({ ...form, general_ovulation_tracking_regular: e.target.value })}>
                <option value="">Non renseigné</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </label>
          </div>
          <div className="input-grid">
            <label>Contraception antérieure<input type="text" value={form.general_contraception_method_before} onChange={e => setForm({ ...form, general_contraception_method_before: e.target.value })} placeholder="Ex: Pilule pendant 10 ans, DIU cuivre..." /></label>
            <label>Date d’arrêt de contraception<input type="date" value={form.general_contraception_stop_date} onChange={e => setForm({ ...form, general_contraception_stop_date: e.target.value })} /></label>
          </div>
          <label>Démarches/consultations déjà faites<input type="text" placeholder="Ex: Vu gynécologue de ville, spermogramme prescrit..." value={form.general_medical_steps} onChange={e => setForm({ ...form, general_medical_steps: e.target.value })} /></label>
          <label>Traitements de fertilité déjà suivis<input type="text" placeholder="Ex: 3 cycles de Clomid, 1 insémination..." value={form.general_prior_treatments} onChange={e => setForm({ ...form, general_prior_treatments: e.target.value })} /></label>
        </div>

        <div className="intake-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Étape 2 · Partenaire féminine</p>
              <h2>Profil santé & cycles</h2>
              <p className="muted">Antécédents, cycles, grossesses, famille.</p>
            </div>
            <span className="pill pill-soft">IMC auto</span>
          </div>

          <div className="info-banner">
            <span style={{fontSize: '1.2rem'}}>👩</span>
            <div>
              <strong>Pour elle :</strong> Ces questions concernent spécifiquement la partenaire féminine.<br/>
              Soyez précise sur les cycles et les antécédents.
            </div>
          </div>

          <div className="input-grid">
            <label>Âge
              <div className="input-wrapper">
                <input type="number" placeholder="Ex: 32" value={form.woman_age} onChange={e => setForm({ ...form, woman_age: e.target.value })} />
                <span className="input-unit">ans</span>
              </div>
            </label>
            <label>Taille
              <div className="input-wrapper">
                <input type="number" placeholder="Ex: 165" value={form.woman_height_cm} onChange={e => setForm({ ...form, woman_height_cm: e.target.value })} />
                <span className="input-unit">cm</span>
              </div>
            </label>
            <label>Poids
              <div className="input-wrapper">
                <input type="number" placeholder="Ex: 60" value={form.woman_weight_kg} onChange={e => setForm({ ...form, woman_weight_kg: e.target.value })} />
                <span className="input-unit">kg</span>
              </div>
            </label>
            <label>IMC
              <div className="input-wrapper">
                <input type="text" value={form.woman_bmi} readOnly style={{backgroundColor: '#f1f5f9', color: '#64748b'}} />
                <span className="input-unit">kg/m²</span>
              </div>
            </label>
          </div>
          <label>Antécédents gynécologiques/médicaux<textarea rows={3} placeholder="Ex: Endométriose stade 1, hypothyroïdie traitée, appendicectomie..." value={form.woman_gyn_history} onChange={e => setForm({ ...form, woman_gyn_history: e.target.value })} /></label>
          <div className="input-grid">
            <label>Cycles réguliers<select value={form.woman_menstrual_regular} onChange={e => setForm({ ...form, woman_menstrual_regular: e.target.value })}><option value="">NR</option><option value="oui">Oui</option><option value="non">Non</option></select></label>
            <label>Durée moyenne
              <div className="input-wrapper">
                <input type="number" placeholder="Ex: 28" value={form.woman_cycle_length_days} onChange={e => setForm({ ...form, woman_cycle_length_days: e.target.value })} />
                <span className="input-unit">jours</span>
              </div>
            </label>
            <label>Variation (si irrégulier)
              <div className="input-wrapper">
                <input type="text" placeholder="Ex: +/- 5" value={form.woman_cycle_variation} onChange={e => setForm({ ...form, woman_cycle_variation: e.target.value })} />
                <span className="input-unit">jours</span>
              </div>
            </label>
          </div>
          <div className="input-grid">
            <label>Abondance des règles<select value={form.woman_period_flow} onChange={e => setForm({ ...form, woman_period_flow: e.target.value })}><option value="">NR</option><option value="light">Léger</option><option value="medium">Moyen</option><option value="heavy">Abondant</option><option value="clots">Hémorragique/Caillots</option></select></label>
            <label>Douleurs (Timing)<input type="text" value={form.woman_pelvic_pain_timing} onChange={e => setForm({ ...form, woman_pelvic_pain_timing: e.target.value })} placeholder="Ex: 1er jour des règles, ovulation..." /></label>
            <label>Intensité douleur
              <div className="input-wrapper">
                <input type="number" min="0" max="10" placeholder="Ex: 4" value={form.woman_dysmenorrhea} onChange={e => setForm({ ...form, woman_dysmenorrhea: e.target.value })} />
                <span className="input-unit">/10</span>
              </div>
            </label>
          </div>
          <div className="input-grid">
            <label>Grossesses antérieures
              <div className="input-wrapper">
                <input type="number" placeholder="0" value={form.woman_pregnancies_count} onChange={e => setForm({ ...form, woman_pregnancies_count: e.target.value })} />
                <span className="input-unit">total</span>
              </div>
            </label>
            <label>Enfants nés vivants
              <div className="input-wrapper">
                <input type="number" placeholder="0" value={form.woman_children_count} onChange={e => setForm({ ...form, woman_children_count: e.target.value })} />
                <span className="input-unit">enfants</span>
              </div>
            </label>
            <label>Fausses couches
              <div className="input-wrapper">
                <input type="number" placeholder="0" value={form.woman_miscarriages_count} onChange={e => setForm({ ...form, woman_miscarriages_count: e.target.value })} />
                <span className="input-unit">FC</span>
              </div>
            </label>
            <label>IVG
              <div className="input-wrapper">
                <input type="number" placeholder="0" value={form.woman_abortions_count} onChange={e => setForm({ ...form, woman_abortions_count: e.target.value })} />
                <span className="input-unit">IVG</span>
              </div>
            </label>
          </div>
          <label>Détails grossesses<textarea rows={2} placeholder="Ex: 2018 accouchement voie basse, 2020 fausse couche à 8SA..." value={form.woman_pregnancies_details} onChange={e => setForm({ ...form, woman_pregnancies_details: e.target.value })} /></label>
          <label>ATCD familiaux (ménopause précoce, infertilité, génétique)<textarea rows={2} placeholder="Ex: Mère ménopausée à 42 ans, sœur endométriose..." value={form.woman_family_history} onChange={e => setForm({ ...form, woman_family_history: e.target.value })} /></label>
          <label>Traitements fertilité déjà suivis (femme)<textarea rows={2} placeholder="Ex: Stimulation simple en 2022..." value={form.woman_prior_fertility_treatments} onChange={e => setForm({ ...form, woman_prior_fertility_treatments: e.target.value })} /></label>
        </div>

        <div className="intake-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Étape 3 · Partenaire masculin</p>
              <h2>Profil andrologique</h2>
              <p className="muted">Antécédents, fertilité prouvée, explorations.</p>
            </div>
            <span className="pill pill-soft">IMC auto</span>
          </div>

          <div className="info-banner">
            <span style={{fontSize: '1.2rem'}}>👨</span>
            <div>
              <strong>Pour lui :</strong> Ces questions concernent spécifiquement le partenaire masculin.<br/>
              Indiquez les antécédents urologiques ou chirurgicaux.
            </div>
          </div>

          <div className="input-grid">
            <label>Âge
              <div className="input-wrapper">
                <input type="number" placeholder="Ex: 34" value={form.man_age} onChange={e => setForm({ ...form, man_age: e.target.value })} />
                <span className="input-unit">ans</span>
              </div>
            </label>
            <label>Taille
              <div className="input-wrapper">
                <input type="number" placeholder="Ex: 180" value={form.man_height_cm} onChange={e => setForm({ ...form, man_height_cm: e.target.value })} />
                <span className="input-unit">cm</span>
              </div>
            </label>
            <label>Poids
              <div className="input-wrapper">
                <input type="number" placeholder="Ex: 80" value={form.man_weight_kg} onChange={e => setForm({ ...form, man_weight_kg: e.target.value })} />
                <span className="input-unit">kg</span>
              </div>
            </label>
            <label>IMC
              <div className="input-wrapper">
                <input type="text" value={form.man_bmi} readOnly style={{backgroundColor: '#f1f5f9', color: '#64748b'}} />
                <span className="input-unit">kg/m²</span>
              </div>
            </label>
          </div>
          <label>Antécédents médicaux/andrologiques<textarea rows={3} placeholder="Ex: Cryptorchidie opérée enfant, varicocèle, diabète..." value={form.man_medical_history} onChange={e => setForm({ ...form, man_medical_history: e.target.value })} /></label>
          <label>Enfants biologiques antérieurs
            <div className="input-wrapper">
              <input type="number" placeholder="0" value={form.man_children_biological_count} onChange={e => setForm({ ...form, man_children_biological_count: e.target.value })} />
              <span className="input-unit">enfants</span>
            </div>
          </label>
          <label>Traitements/évaluations (homme)<textarea rows={2} placeholder="Ex: Spermogramme en 2021 (normal), vitamines..." value={form.man_treatments} onChange={e => setForm({ ...form, man_treatments: e.target.value })} /></label>
          <label>ATCD familiaux (homme)<textarea rows={2} placeholder="Ex: Frère avec problèmes de fertilité..." value={form.man_family_history} onChange={e => setForm({ ...form, man_family_history: e.target.value })} /></label>
        </div>

        <div className="intake-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Étape 4 · Mode de vie</p>
              <h2>Habitudes & expositions</h2>
              <p className="muted">Tabac, alcool, caféine, alimentation, stress, environnement.</p>
            </div>
          </div>

          <div className="info-banner">
            <span style={{fontSize: '1.2rem'}}>ℹ️</span>
            <div>
              <strong>Consigne de remplissage :</strong><br/>
              Laissez les cases vides si vous ne consommez pas ou n'êtes pas concerné(e).<br/>
              Ne mettez "0" que si vous voulez explicitement indiquer une valeur nulle.
            </div>
          </div>

          <div className="split-section">
            <div className="split-col">
              <h4>👤 Elle (Partenaire féminine)</h4>
              
              <label>Tabac
                <div className="input-wrapper">
                  <input type="number" placeholder="Ex: 5" value={form.lifestyle_smoking_woman_cigs_per_day} onChange={e => setForm({ ...form, lifestyle_smoking_woman_cigs_per_day: e.target.value })} />
                  <span className="input-unit">cig/j</span>
                </div>
                <span className="form-hint">Laissez vide si non-fumeuse</span>
              </label>

              <label>Alcool
                <select value={form.lifestyle_alcohol_woman} onChange={e => setForm({ ...form, lifestyle_alcohol_woman: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  <option value="jamais">Jamais</option>
                  <option value="occasionnel">Occasionnel (social)</option>
                  <option value="modéré">Modéré (1-3 verres/sem)</option>
                  <option value="régulier">Régulier (4+ verres/sem)</option>
                </select>
              </label>

              <label>Caféine
                <div className="input-wrapper">
                  <input type="number" placeholder="Ex: 2" value={form.lifestyle_caffeine_woman_cups_per_day} onChange={e => setForm({ ...form, lifestyle_caffeine_woman_cups_per_day: e.target.value })} />
                  <span className="input-unit">tasses/j</span>
                </div>
              </label>

              <label>Suppléments
                <input type="text" placeholder="Ex: Acide folique, Vit D..." value={form.lifestyle_supplements_woman} onChange={e => setForm({ ...form, lifestyle_supplements_woman: e.target.value })} />
              </label>

              <label>Activité physique
                <select value={form.lifestyle_activity_woman} onChange={e => setForm({ ...form, lifestyle_activity_woman: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  <option value="sédentaire">Sédentaire (peu de sport)</option>
                  <option value="modérée">Modérée (1-2h/sem)</option>
                  <option value="active">Active (3-5h/sem)</option>
                  <option value="intensive">Intensive (compétition, &gt;5h)</option>
                </select>
              </label>
            </div>

            <div className="split-col" style={{borderLeft: '1px solid var(--border-light)', paddingLeft: '2rem'}}>
              <h4>👤 Lui (Partenaire masculin)</h4>
              
              <label>Tabac
                <div className="input-wrapper">
                  <input type="number" placeholder="Ex: 10" value={form.lifestyle_smoking_man_cigs_per_day} onChange={e => setForm({ ...form, lifestyle_smoking_man_cigs_per_day: e.target.value })} />
                  <span className="input-unit">cig/j</span>
                </div>
                <span className="form-hint">Laissez vide si non-fumeur</span>
              </label>

              <label>Alcool
                <select value={form.lifestyle_alcohol_man} onChange={e => setForm({ ...form, lifestyle_alcohol_man: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  <option value="jamais">Jamais</option>
                  <option value="occasionnel">Occasionnel (social)</option>
                  <option value="modéré">Modéré (1-3 verres/sem)</option>
                  <option value="régulier">Régulier (4+ verres/sem)</option>
                </select>
              </label>

              <label>Caféine
                <div className="input-wrapper">
                  <input type="number" placeholder="Ex: 3" value={form.lifestyle_caffeine_man_cups_per_day} onChange={e => setForm({ ...form, lifestyle_caffeine_man_cups_per_day: e.target.value })} />
                  <span className="input-unit">tasses/j</span>
                </div>
              </label>

              <label>Suppléments
                <input type="text" placeholder="Ex: Zinc, Multivit..." value={form.lifestyle_supplements_man} onChange={e => setForm({ ...form, lifestyle_supplements_man: e.target.value })} />
              </label>

              <label>Activité physique
                <select value={form.lifestyle_activity_man} onChange={e => setForm({ ...form, lifestyle_activity_man: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  <option value="sédentaire">Sédentaire (peu de sport)</option>
                  <option value="modérée">Modérée (1-2h/sem)</option>
                  <option value="active">Active (3-5h/sem)</option>
                  <option value="intensive">Intensive (compétition, &gt;5h)</option>
                </select>
              </label>
            </div>
          </div>

          <div style={{marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem'}}>
            <h4 style={{fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '1rem'}}>Facteurs communs & Environnement</h4>
            <div className="input-grid">
              <label>Sommeil (heures/nuit)
                <div className="input-wrapper">
                  <input type="number" placeholder="Ex: 7.5" value={form.lifestyle_sleep_hours} onChange={e => setForm({ ...form, lifestyle_sleep_hours: e.target.value })} />
                  <span className="input-unit">h</span>
                </div>
              </label>
              <label>Qualité sommeil
                <select value={form.lifestyle_sleep_quality} onChange={e => setForm({ ...form, lifestyle_sleep_quality: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  <option value="good">Bonne (réparateur)</option>
                  <option value="average">Moyenne</option>
                  <option value="poor">Mauvaise (réveils, insomnie)</option>
                </select>
              </label>
              <label>Niveau de stress
                <select value={form.lifestyle_stress_level} onChange={e => setForm({ ...form, lifestyle_stress_level: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  <option value="faible">Faible</option>
                  <option value="modéré">Modéré</option>
                  <option value="élevé">Élevé</option>
                </select>
              </label>
            </div>
            <label>Alimentation (Habitudes générales du couple)<textarea rows={2} placeholder="Ex: Équilibrée, végétarienne, beaucoup de fast-food..." value={form.lifestyle_diet} onChange={e => setForm({ ...form, lifestyle_diet: e.target.value })} /></label>
            <label>Expositions pro/environnementales<textarea rows={2} value={form.lifestyle_exposure} onChange={e => setForm({ ...form, lifestyle_exposure: e.target.value })} placeholder="Ex: Travail de nuit, pesticides, solvants, chaleur excessive..." /></label>
          </div>
        </div>

        <div className="intake-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Étape 5 · Examens</p>
              <h2>Bilan bio & imagerie</h2>
              <p className="muted">Valeurs hormonales, échographies, HSG, spermogramme.</p>
            </div>
          </div>

          <div className="info-banner">
            <span style={{fontSize: '1.2rem'}}>ℹ️</span>
            <div>
              <strong>Important :</strong> Laissez les cases vides si vous n'avez pas fait l'examen.<br/>
              Ne mettez "0" que si le résultat indiqué sur votre feuille de laboratoire est bien 0.
            </div>
          </div>

          <h4 className="sub-heading">Examens — Partenaire féminine</h4>
          <div className="input-grid">
            <label>FSH (J3)
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="Ex: 6.5" value={form.labs_female_fsh} onChange={e => setForm({ ...form, labs_female_fsh: e.target.value })} />
                <span className="input-unit">mUI/mL</span>
              </div>
            </label>
            <label>LH (J3)
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="Ex: 4.2" value={form.labs_female_lh} onChange={e => setForm({ ...form, labs_female_lh: e.target.value })} />
                <span className="input-unit">mUI/mL</span>
              </div>
            </label>
            <label>E2 (J3)
              <div className="input-wrapper">
                <input type="number" step="1" placeholder="Ex: 45" value={form.labs_female_e2} onChange={e => setForm({ ...form, labs_female_e2: e.target.value })} />
                <span className="input-unit">pg/mL</span>
              </div>
            </label>
            <label>AMH
              <div className="input-wrapper">
                <input type="number" step="0.01" placeholder="Ex: 2.1" value={form.labs_female_amh} onChange={e => setForm({ ...form, labs_female_amh: e.target.value })} />
                <span className="input-unit">ng/mL</span>
              </div>
            </label>
            <label>TSH
              <div className="input-wrapper">
                <input type="number" step="0.01" placeholder="Ex: 1.8" value={form.labs_female_tsh} onChange={e => setForm({ ...form, labs_female_tsh: e.target.value })} />
                <span className="input-unit">mUI/L</span>
              </div>
            </label>
            <label>Prolactine
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="Ex: 12" value={form.labs_female_prolactin} onChange={e => setForm({ ...form, labs_female_prolactin: e.target.value })} />
                <span className="input-unit">ng/mL</span>
              </div>
            </label>
            <label>Progestérone (J21)
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="Ex: 15" value={form.labs_female_progesterone_day21} onChange={e => setForm({ ...form, labs_female_progesterone_day21: e.target.value })} />
                <span className="input-unit">ng/mL</span>
              </div>
            </label>
          </div>
          <label>Échographie pelvienne (CFA, fibromes, SOPK, endomètre...)<textarea rows={2} placeholder="Ex: Utérus normal, ovaires aspect normal, CFA 12 à droite..." value={form.imaging_ultrasound_notes} onChange={e => setForm({ ...form, imaging_ultrasound_notes: e.target.value })} /></label>
          <label>Hystérosalpingographie (perméabilité des trompes)<textarea rows={2} placeholder="Ex: Trompes perméables bilatéralement, pas d'anomalie..." value={form.imaging_hsg_result} onChange={e => setForm({ ...form, imaging_hsg_result: e.target.value })} /></label>
          <label>Autres examens femme<textarea rows={2} value={form.imaging_other} onChange={e => setForm({ ...form, imaging_other: e.target.value })} /></label>

          <h4 className="sub-heading">Examens — Partenaire masculin</h4>
          <div className="input-grid">
            <label>Volume
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="Ex: 3.5" value={form.spermo_volume_ml} onChange={e => setForm({ ...form, spermo_volume_ml: e.target.value })} />
                <span className="input-unit">mL</span>
              </div>
            </label>
            <label>Concentration
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="Ex: 45" value={form.spermo_concentration_million_per_ml} onChange={e => setForm({ ...form, spermo_concentration_million_per_ml: e.target.value })} />
                <span className="input-unit">M/mL</span>
              </div>
            </label>
            <label>Motilité progressive
              <div className="input-wrapper">
                <input type="number" step="1" placeholder="Ex: 55" value={form.spermo_progressive_motility_percent} onChange={e => setForm({ ...form, spermo_progressive_motility_percent: e.target.value })} />
                <span className="input-unit">%</span>
              </div>
            </label>
            <label>Morphologie normale
              <div className="input-wrapper">
                <input type="number" step="1" placeholder="Ex: 4" value={form.spermo_normal_morphology_percent} onChange={e => setForm({ ...form, spermo_normal_morphology_percent: e.target.value })} />
                <span className="input-unit">%</span>
              </div>
            </label>
          </div>
          <label>Autres observations spermogramme<textarea rows={2} placeholder="Ex: Agglutinats, viscosité, leucocytes..." value={form.spermo_other_observations} onChange={e => setForm({ ...form, spermo_other_observations: e.target.value })} /></label>
          <div className="input-grid">
            <label>Testostérone
              <div className="input-wrapper">
                <input type="number" step="10" placeholder="Ex: 450" value={form.labs_male_testosterone} onChange={e => setForm({ ...form, labs_male_testosterone: e.target.value })} />
                <span className="input-unit">ng/dL</span>
              </div>
            </label>
            <label>FSH
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="Ex: 5.2" value={form.labs_male_fsh} onChange={e => setForm({ ...form, labs_male_fsh: e.target.value })} />
                <span className="input-unit">UI/L</span>
              </div>
            </label>
            <label>LH
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="Ex: 4.1" value={form.labs_male_lh} onChange={e => setForm({ ...form, labs_male_lh: e.target.value })} />
                <span className="input-unit">UI/L</span>
              </div>
            </label>
          </div>
          <label>Échographie testiculaire<textarea rows={2} placeholder="Ex: Varicocèle gauche grade 2..." value={form.imaging_testicular_ultrasound} onChange={e => setForm({ ...form, imaging_testicular_ultrasound: e.target.value })} /></label>
          <label>Autres examens homme<textarea rows={2} value={form.male_other_tests} onChange={e => setForm({ ...form, male_other_tests: e.target.value })} /></label>
        </div>

        <div className="intake-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Étape 6 · Notes</p>
              <h2>Commentaires supplémentaires</h2>
              <p className="muted">Ajoutez tout détail utile pour affiner l’analyse.</p>
            </div>
          </div>
          <label>Informations additionnelles<textarea rows={3} placeholder="Ex: Nous avons un RDV prévu le mois prochain, je prends aussi de la vitamine D..." value={form.additional_comments} onChange={e => setForm({ ...form, additional_comments: e.target.value })} /></label>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={submit}>Obtenir mes recommandations</button>
            <p className="text-muted text-small" style={{ margin: 0 }}>
              Disclaimer: outil informatif, ne remplace pas l’avis d’un médecin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
