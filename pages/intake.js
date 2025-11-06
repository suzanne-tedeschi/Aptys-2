import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function readQuery(){
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  return { userId: p.get('userId') };
}

export default function Intake(){
  const router = useRouter();
  const q = readQuery();
  const [userId, setUserId] = useState(q.userId || '');
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const [form, setForm] = useState({ 
    // Étape 1: Informations personnelles
    age: '', 
    sex: '', 
    weight: '', 
    height: '', 
    bmi: '',
    
    // Étape 2: Habitudes de vie
    smoker: false,
    smokingYears: '',
    cigarettesPerDay: '',
    formerSmoker: false,
    alcoholConsumption: '',
    physicalActivity: '',
    diet: '',
    
    // Étape 3: Antécédents personnels
    chronicDiseases: [],
    pastSurgeries: [],
    currentMedications: [],
    allergies: [],
    
    // Étape 4: Santé cardiovasculaire
    hypertension: false,
    cholesterol: false,
    diabetes: false,
    heartDisease: false,
    
    // Étape 5: Antécédents familiaux
    familyHistory: {
      maternal: {
        cancer: [],
        heartDisease: false,
        diabetes: false,
        alzheimer: false,
        otherConditions: ''
      },
      paternal: {
        cancer: [],
        heartDisease: false,
        diabetes: false,
        alzheimer: false,
        otherConditions: ''
      }
    },
    
    // Étape 6: Santé reproductive (femmes)
    pregnancies: '',
    menopauseAge: '',
    hormonalTreatment: false,
    breastfeeding: '',
    hormonalContraception: '',
    hormonalContraceptionYears: '',
    
    // Étape 7: Dépistages déjà effectués
    screenings: {
      mammography: { date: '', hasReport: false, reportUploaded: false },
      colonoscopy: { date: '', hasReport: false, reportUploaded: false },
      papSmear: { date: '', hasReport: false, reportUploaded: false },
      bloodTest: { date: '', hasReport: false, reportUploaded: false },
      dentalVisit: { date: '', hasReport: false, reportUploaded: false }
    },
    
    // Étape 8: Expositions et risques
    occupationalExposure: [],
    sunExposure: '',
    vaccinationStatus: '',
    travelHistory: ''
  });

  useEffect(()=>{ if(q.userId) setUserId(q.userId); }, []);

  // Calcul automatique de l'IMC
  useEffect(() => {
    if (form.weight && form.height) {
      const weightKg = parseFloat(form.weight);
      const heightM = parseFloat(form.height) / 100; // conversion cm -> m
      if (weightKg > 0 && heightM > 0) {
        const calculatedBmi = (weightKg / (heightM * heightM)).toFixed(1);
        setForm(prev => ({ ...prev, bmi: calculatedBmi }));
      }
    }
  }, [form.weight, form.height]);

  async function saveDraft(){
    if(!userId){ alert('Missing userId'); return; }
    await fetch(`/api/user/${userId}/draft`, { method: 'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({form}) });
    alert('Brouillon sauvegardé');
  }

  async function submit(){
    if(!userId){ alert('Missing userId'); return; }
    
    // Afficher un message de chargement
    const loadingMessage = 'Génération de vos recommandations personnalisées par IA médicale...\n\nCela peut prendre 10-20 secondes. Merci de patienter.';
    
    // Créer un overlay de chargement
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `
      <div style="background:white;padding:2rem;border-radius:12px;text-align:center;max-width:500px;">
        <div style="font-size:3rem;margin-bottom:1rem;">🤖</div>
        <h3 style="margin-bottom:1rem;color:#1e293b;">Analyse en cours...</h3>
        <p style="color:#64748b;margin-bottom:1.5rem;">
          Notre IA médicale analyse votre profil de santé et génère des recommandations personnalisées basées sur les guidelines françaises (HAS, INCa).
        </p>
        <div style="width:100%;height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;">
          <div style="width:30%;height:100%;background:#3b82f6;animation:loading 2s ease-in-out infinite;"></div>
        </div>
        <style>
          @keyframes loading {
            0% { width: 30%; margin-left: 0%; }
            50% { width: 50%; margin-left: 25%; }
            100% { width: 30%; margin-left: 70%; }
          }
        </style>
      </div>
    `;
    document.body.appendChild(overlay);
    
    try {
      // 1. Sauvegarder les données du formulaire
      await fetch(`/api/user/${userId}/draft`, { 
        method: 'POST', 
        headers: {'content-type':'application/json'}, 
        body: JSON.stringify({ form, is_draft: false }) 
      });
      
      // 2. Appeler l'API de génération de recommandations par IA
      const res = await fetch('/api/generate-recommendations', { 
        method: 'POST', 
        headers: {'content-type':'application/json'}, 
        body: JSON.stringify({ 
          userId: userId,
          formData: form
        }) 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la génération des recommandations');
      }
      
      const json = await res.json();
      
      // Retirer l'overlay
      document.body.removeChild(overlay);
      
      // Afficher un message de succès
      alert(`✅ Recommandations générées avec succès !\n\n${json.metadata.total_count} recommandations personnalisées ont été créées.\n${json.metadata.high_priority_count} recommandations à priorité élevée identifiées.`);
      
      // Rediriger vers le dashboard
      router.push(`/dashboard?userId=${userId}`);
      
    } catch (error) {
      // Retirer l'overlay en cas d'erreur
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      
      console.error('Erreur lors de la soumission:', error);
      alert(`❌ Erreur lors de la génération des recommandations:\n\n${error.message}\n\nVeuillez vérifier que votre clé API OpenAI est configurée dans .env.local`);
    }
  }

  function uploadFile(file, screeningType = null, screeningDate = null){
    const reader = new FileReader();
    reader.onload = async ()=>{
      const payload = { 
        userId, 
        filename: file.name, 
        data: reader.result.split(',')[1],
        documentCategory: screeningType ? 'screening_report' : 'other',
        screeningType: screeningType,
        screeningDate: screeningDate
      };
      await fetch('/api/upload', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(payload) });
      alert('Fichier envoyé (chiffré)');
    };
    reader.readAsDataURL(file);
  }

  const toggleArrayItem = (arr, item) => {
    if (arr.includes(item)) {
      return arr.filter(i => i !== item);
    }
    return [...arr, item];
  };

  const renderProgressBar = () => {
    const segments = [];
    for (let i = 1; i <= totalSteps; i++) {
      segments.push(
        <div 
          key={i} 
          style={{
            flex: 1, 
            height: '6px', 
            background: step >= i ? '#3b82f6' : '#e2e8f0', 
            borderRadius: '3px',
            transition: 'background 0.3s ease'
          }}
        />
      );
    }
    return segments;
  };

  return (
    <div className="container">
      <h1>Questionnaire santé complet</h1>
      <div className="card">
        <div style={{marginBottom: '2rem', padding: '1rem', background: 'linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%)', borderRadius: '12px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
            <span style={{fontWeight: 600, color: '#4a5568'}}>Étape {step} sur {totalSteps}</span>
            <span style={{fontSize: '0.9rem', color: '#64748b'}}>{Math.round((step / totalSteps) * 100)}% complété</span>
          </div>
          <div style={{display: 'flex', gap: '0.25rem'}}>
            {renderProgressBar()}
          </div>
        </div>

        {/* ÉTAPE 1: Informations personnelles */}
        {step===1 && (
          <div>
            <h3 style={{marginTop: 0}}>📋 Informations personnelles</h3>
            <p className="muted" style={{marginBottom: '1.5rem'}}>Ces informations nous permettent de personnaliser vos recommandations</p>
            
            <label>
              <span>Âge *</span>
              <input type="number" value={form.age} onChange={e=>setForm({...form, age:e.target.value})} placeholder="Ex: 45" required />
            </label>
            
            <label>
              <span>Sexe à la naissance *</span>
              <select value={form.sex} onChange={e=>setForm({...form, sex:e.target.value})} required>
                <option value="">-- Sélectionnez --</option>
                <option value="female">Femme</option>
                <option value="male">Homme</option>
              </select>
            </label>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
              <label>
                <span>Poids (kg) *</span>
                <input type="number" step="0.1" value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})} placeholder="Ex: 70" required />
              </label>
              <label>
                <span>Taille (cm) *</span>
                <input type="number" step="0.1" value={form.height} onChange={e=>setForm({...form, height:e.target.value})} placeholder="Ex: 170" required />
              </label>
            </div>

            {form.bmi && (
              <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #bae6fd'}}>
                <span style={{color: '#0c4a6e', fontWeight: 600}}>📊 IMC calculé : {form.bmi}</span>
                <small style={{display: 'block', color: '#475569', marginTop: '0.5rem'}}>
                  {parseFloat(form.bmi) < 18.5 && '(Insuffisance pondérale)'}
                  {parseFloat(form.bmi) >= 18.5 && parseFloat(form.bmi) < 25 && '(Poids normal)'}
                  {parseFloat(form.bmi) >= 25 && parseFloat(form.bmi) < 30 && '(Surpoids)'}
                  {parseFloat(form.bmi) >= 30 && '(Obésité)'}
                </small>
              </div>
            )}

            <div style={{marginTop:'2rem', display: 'flex', justifyContent: 'flex-end'}}>
              <button className="btn" onClick={()=>setStep(2)}>Suivant →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Habitudes de vie */}
        {step===2 && (
          <div>
            <h3 style={{marginTop: 0}}>🚬 Habitudes de vie</h3>
            <p className="muted" style={{marginBottom: '1.5rem'}}>Vos habitudes quotidiennes influencent vos risques de santé</p>
            
            <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '1rem', background: '#f7fafc', borderRadius: '12px', marginBottom: '1rem'}}>
              <input type="checkbox" checked={form.smoker} onChange={e=>setForm({...form, smoker:e.target.checked})} />
              <span>Je suis actuellement fumeur/fumeuse</span>
            </label>

            {form.smoker && (
              <div style={{marginLeft: '2rem', marginBottom: '1.5rem'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <label>
                    <span>Depuis combien d'années ?</span>
                    <input type="number" value={form.smokingYears} onChange={e=>setForm({...form, smokingYears:e.target.value})} placeholder="Ex: 15" />
                  </label>
                  <label>
                    <span>Cigarettes par jour</span>
                    <input type="number" value={form.cigarettesPerDay} onChange={e=>setForm({...form, cigarettesPerDay:e.target.value})} placeholder="Ex: 10" />
                  </label>
                </div>
              </div>
            )}
            
            <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '1rem', background: '#f7fafc', borderRadius: '12px', marginBottom: '1.5rem'}}>
              <input type="checkbox" checked={form.formerSmoker} onChange={e=>setForm({...form, formerSmoker:e.target.checked})} />
              <span>J'ai été fumeur/fumeuse dans le passé</span>
            </label>
            
            <label>
              <span>Consommation d'alcool</span>
              <select value={form.alcoholConsumption} onChange={e=>setForm({...form, alcoholConsumption:e.target.value})}>
                <option value="">-- Sélectionnez --</option>
                <option value="none">Jamais</option>
                <option value="occasional">Occasionnellement (1-2 fois/mois)</option>
                <option value="moderate">Modérément (1-2 fois/semaine)</option>
                <option value="regular">Régulièrement (3-6 fois/semaine)</option>
                <option value="daily">Quotidiennement</option>
              </select>
            </label>
            
            <label>
              <span>Activité physique</span>
              <select value={form.physicalActivity} onChange={e=>setForm({...form, physicalActivity:e.target.value})}>
                <option value="">-- Sélectionnez --</option>
                <option value="sedentary">Sédentaire (peu ou pas d'exercice)</option>
                <option value="light">Légère (1-2 fois/semaine)</option>
                <option value="moderate">Modérée (3-4 fois/semaine)</option>
                <option value="active">Active (5+ fois/semaine)</option>
                <option value="very_active">Très active (exercice intensif quotidien)</option>
              </select>
            </label>
            
            <label>
              <span>Type d'alimentation</span>
              <select value={form.diet} onChange={e=>setForm({...form, diet:e.target.value})}>
                <option value="">-- Sélectionnez --</option>
                <option value="omnivore">Omnivore</option>
                <option value="vegetarian">Végétarien</option>
                <option value="vegan">Végétalien/Vegan</option>
                <option value="pescatarian">Pescatarien</option>
                <option value="mediterranean">Méditerranéenne</option>
                <option value="other">Autre régime spécifique</option>
              </select>
            </label>

            <div style={{marginTop:'2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between'}}>
              <button className="btn btn-secondary" onClick={()=>setStep(1)}>← Précédent</button>
              <button className="btn" onClick={()=>setStep(3)}>Suivant →</button>
            </div>
          </div>
        )}

        {step===3 && (
          <div>
            <h3 style={{marginTop: 0}}>🏥 Antécédents personnels</h3>
            <p className="muted" style={{marginBottom: '1.5rem'}}>Vos antécédents médicaux personnels</p>
            
            <label>
              <span>Maladies chroniques diagnostiquées</span>
              <small className="muted" style={{display: 'block', marginTop: '0.25rem', marginBottom: '0.5rem'}}>Cochez toutes les conditions qui s'appliquent</small>
            </label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem'}}>
              {['Diabète', 'Hypertension', 'Asthme', 'BPCO', 'Maladie cardiaque', 'AVC', 'Cancer', 'Dépression', 'Anxiété', 'Arthrite', 'Ostéoporose', 'Maladie rénale'].map(disease => (
                <label key={disease} style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: form.chronicDiseases.includes(disease) ? '#e0f2fe' : '#f8fafc', borderRadius: '8px', border: form.chronicDiseases.includes(disease) ? '2px solid #3b82f6' : '1px solid #e2e8f0', transition: 'all 0.2s'}}>
                  <input type="checkbox" checked={form.chronicDiseases.includes(disease)} onChange={e=>setForm({...form, chronicDiseases: toggleArrayItem(form.chronicDiseases, disease)})} />
                  <span style={{fontSize: '0.95rem'}}>{disease}</span>
                </label>
              ))}
            </div>
            
            <label>
              <span>Interventions chirurgicales majeures</span>
              <input type="text" value={form.pastSurgeries.join(', ')} onChange={e=>setForm({...form, pastSurgeries: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="Ex: Appendicectomie 2015, Cholécystectomie 2018..." />
              <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>Séparez par des virgules</small>
            </label>
            
            <label>
              <span>Médicaments actuels</span>
              <input type="text" value={form.currentMedications.join(', ')} onChange={e=>setForm({...form, currentMedications: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="Ex: Metformine, Lisinopril, Aspirine..." />
              <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>Séparez par des virgules</small>
            </label>
            
            <label>
              <span>Allergies connues (médicaments, aliments, autres)</span>
              <input type="text" value={form.allergies.join(', ')} onChange={e=>setForm({...form, allergies: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="Ex: Pénicilline, Fruits à coque, Pollen..." />
              <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>Séparez par des virgules</small>
            </label>

            <div style={{marginTop:'2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between'}}>
              <button className="btn btn-secondary" onClick={()=>setStep(2)}>← Précédent</button>
              <button className="btn" onClick={()=>setStep(4)}>Suivant →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 4: Santé cardiovasculaire */}
        {step===4 && (
          <div>
            <h3 style={{marginTop: 0}}>❤️ Santé cardiovasculaire</h3>
            <p className="muted" style={{marginBottom: '1.5rem'}}>Facteurs de risque cardiovasculaire</p>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem'}}>
              <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '1rem', background: '#f7fafc', borderRadius: '12px'}}>
                <input type="checkbox" checked={form.hypertension} onChange={e=>setForm({...form, hypertension:e.target.checked})} />
                <span>Hypertension artérielle diagnostiquée</span>
              </label>
              
              <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '1rem', background: '#f7fafc', borderRadius: '12px'}}>
                <input type="checkbox" checked={form.cholesterol} onChange={e=>setForm({...form, cholesterol:e.target.checked})} />
                <span>Taux de cholestérol élevé</span>
              </label>
              
              <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '1rem', background: '#f7fafc', borderRadius: '12px'}}>
                <input type="checkbox" checked={form.diabetes} onChange={e=>setForm({...form, diabetes:e.target.checked})} />
                <span>Diabète (Type 1 ou 2)</span>
              </label>
              
              <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '1rem', background: '#f7fafc', borderRadius: '12px'}}>
                <input type="checkbox" checked={form.heartDisease} onChange={e=>setForm({...form, heartDisease:e.target.checked})} />
                <span>Maladie cardiaque (infarctus, angine, insuffisance cardiaque)</span>
              </label>
            </div>

            <div style={{marginTop:'2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between'}}>
              <button className="btn btn-secondary" onClick={()=>setStep(3)}>← Précédent</button>
              <button className="btn" onClick={()=>setStep(5)}>Suivant →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 5: Antécédents familiaux */}
        {step===5 && (
          <div>
            <h3 style={{marginTop: 0}}>👨‍👩‍👧‍👦 Antécédents familiaux</h3>
            <p className="muted" style={{marginBottom: '1.5rem'}}>Il est important de différencier les antécédents côté maternel et paternel</p>
            
            {/* Côté Maternel */}
            <div style={{marginBottom: '2.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '12px', border: '2px solid #f59e0b'}}>
              <h4 style={{marginTop: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                👩 Côté maternel
                <span style={{fontSize: '0.9rem', fontWeight: 'normal', color: '#92400e'}}>(Mère, frères/sœurs de la mère, grands-parents maternels)</span>
              </h4>
              
              <label>
                <span style={{fontWeight: 600}}>Cancers côté maternel</span>
                <small className="muted" style={{display: 'block', marginTop: '0.25rem', marginBottom: '0.5rem'}}>Cochez tous les types diagnostiqués</small>
              </label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem'}}>
                {['Cancer du sein', 'Cancer colorectal', 'Cancer de la prostate', 'Cancer du poumon', 'Cancer des ovaires', 'Cancer de l\'utérus', 'Leucémie', 'Mélanome'].map(cancer => (
                  <label key={`maternal-${cancer}`} style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: form.familyHistory.maternal.cancer.includes(cancer) ? '#fed7aa' : 'white', borderRadius: '8px', border: form.familyHistory.maternal.cancer.includes(cancer) ? '2px solid #ea580c' : '1px solid #e2e8f0', transition: 'all 0.2s'}}>
                    <input type="checkbox" checked={form.familyHistory.maternal.cancer.includes(cancer)} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, maternal: {...form.familyHistory.maternal, cancer: toggleArrayItem(form.familyHistory.maternal.cancer, cancer)}}})} />
                    <span style={{fontSize: '0.9rem'}}>{cancer}</span>
                  </label>
                ))}
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1rem'}}>
                <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: 'white', borderRadius: '8px'}}>
                  <input type="checkbox" checked={form.familyHistory.maternal.heartDisease} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, maternal: {...form.familyHistory.maternal, heartDisease: e.target.checked}}})} />
                  <span style={{fontSize: '0.95rem'}}>Maladie cardiovasculaire précoce</span>
                </label>
                <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: 'white', borderRadius: '8px'}}>
                  <input type="checkbox" checked={form.familyHistory.maternal.diabetes} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, maternal: {...form.familyHistory.maternal, diabetes: e.target.checked}}})} />
                  <span style={{fontSize: '0.95rem'}}>Diabète de type 2</span>
                </label>
                <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: 'white', borderRadius: '8px'}}>
                  <input type="checkbox" checked={form.familyHistory.maternal.alzheimer} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, maternal: {...form.familyHistory.maternal, alzheimer: e.target.checked}}})} />
                  <span style={{fontSize: '0.95rem'}}>Maladie d'Alzheimer ou démence</span>
                </label>
              </div>
              
              <label>
                <span style={{fontSize: '0.95rem'}}>Autres conditions côté maternel</span>
                <input type="text" value={form.familyHistory.maternal.otherConditions} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, maternal: {...form.familyHistory.maternal, otherConditions: e.target.value}}})} placeholder="Ex: Maladie de Crohn..." />
              </label>
            </div>

            {/* Côté Paternel */}
            <div style={{marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '12px', border: '2px solid #3b82f6'}}>
              <h4 style={{marginTop: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                👨 Côté paternel
                <span style={{fontSize: '0.9rem', fontWeight: 'normal', color: '#1e3a8a'}}>(Père, frères/sœurs du père, grands-parents paternels)</span>
              </h4>
              
              <label>
                <span style={{fontWeight: 600}}>Cancers côté paternel</span>
                <small className="muted" style={{display: 'block', marginTop: '0.25rem', marginBottom: '0.5rem'}}>Cochez tous les types diagnostiqués</small>
              </label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem'}}>
                {['Cancer du sein', 'Cancer colorectal', 'Cancer de la prostate', 'Cancer du poumon', 'Cancer des ovaires', 'Cancer de l\'utérus', 'Leucémie', 'Mélanome'].map(cancer => (
                  <label key={`paternal-${cancer}`} style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: form.familyHistory.paternal.cancer.includes(cancer) ? '#93c5fd' : 'white', borderRadius: '8px', border: form.familyHistory.paternal.cancer.includes(cancer) ? '2px solid #2563eb' : '1px solid #e2e8f0', transition: 'all 0.2s'}}>
                    <input type="checkbox" checked={form.familyHistory.paternal.cancer.includes(cancer)} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, paternal: {...form.familyHistory.paternal, cancer: toggleArrayItem(form.familyHistory.paternal.cancer, cancer)}}})} />
                    <span style={{fontSize: '0.9rem'}}>{cancer}</span>
                  </label>
                ))}
              </div>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1rem'}}>
                <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: 'white', borderRadius: '8px'}}>
                  <input type="checkbox" checked={form.familyHistory.paternal.heartDisease} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, paternal: {...form.familyHistory.paternal, heartDisease: e.target.checked}}})} />
                  <span style={{fontSize: '0.95rem'}}>Maladie cardiovasculaire précoce</span>
                </label>
                <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: 'white', borderRadius: '8px'}}>
                  <input type="checkbox" checked={form.familyHistory.paternal.diabetes} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, paternal: {...form.familyHistory.paternal, diabetes: e.target.checked}}})} />
                  <span style={{fontSize: '0.95rem'}}>Diabète de type 2</span>
                </label>
                <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: 'white', borderRadius: '8px'}}>
                  <input type="checkbox" checked={form.familyHistory.paternal.alzheimer} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, paternal: {...form.familyHistory.paternal, alzheimer: e.target.checked}}})} />
                  <span style={{fontSize: '0.95rem'}}>Maladie d'Alzheimer ou démence</span>
                </label>
              </div>
              
              <label>
                <span style={{fontSize: '0.95rem'}}>Autres conditions côté paternel</span>
                <input type="text" value={form.familyHistory.paternal.otherConditions} onChange={e=>setForm({...form, familyHistory: {...form.familyHistory, paternal: {...form.familyHistory.paternal, otherConditions: e.target.value}}})} placeholder="Ex: Sclérose en plaques..." />
              </label>
            </div>

            <div style={{marginTop:'2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between'}}>
              <button className="btn btn-secondary" onClick={()=>setStep(4)}>← Précédent</button>
              <button className="btn" onClick={()=>setStep(6)}>Suivant →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 6: Santé reproductive (femmes) */}
        {step===6 && (
          <div>
            <h3 style={{marginTop: 0}}>👶 Santé reproductive</h3>
            {form.sex === 'female' ? (
              <>
                <p className="muted" style={{marginBottom: '1.5rem'}}>Ces informations nous aident à personnaliser vos recommandations de dépistage gynécologique</p>
                
                <div style={{padding: '1.5rem', background: '#fef3c7', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fbbf24'}}>
                  <h4 style={{marginTop: 0, color: '#92400e', fontSize: '1.1rem'}}>📊 Historique de grossesse</h4>
                  
                  <label>
                    <span>Nombre de grossesses (y compris fausses couches et IVG)</span>
                    <input type="number" min="0" value={form.pregnancies} onChange={e=>setForm({...form, pregnancies:e.target.value})} placeholder="Ex: 2" />
                    <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>Laissez à 0 si vous n'avez jamais été enceinte</small>
                  </label>
                  
                  <label>
                    <span>Durée totale d'allaitement (en mois)</span>
                    <input type="number" min="0" value={form.breastfeeding} onChange={e=>setForm({...form, breastfeeding:e.target.value})} placeholder="Ex: 18" />
                    <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>Total cumulé pour tous les enfants. Mettez 0 si aucun allaitement.</small>
                  </label>
                </div>
                
                <div style={{padding: '1.5rem', background: '#e0f2fe', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #38bdf8'}}>
                  <h4 style={{marginTop: 0, color: '#075985', fontSize: '1.1rem'}}>🌸 Statut menstruel</h4>
                  
                  <label>
                    <span>Êtes-vous ménopausée ?</span>
                    <select value={form.menopauseAge ? 'yes' : 'no'} onChange={e=> e.target.value === 'yes' ? null : setForm({...form, menopauseAge: ''})}>
                      <option value="no">Non, je suis toujours réglée</option>
                      <option value="yes">Oui, je suis ménopausée</option>
                    </select>
                  </label>
                  
                  {form.menopauseAge !== '' && (
                    <label>
                      <span>Âge à la ménopause</span>
                      <input type="number" min="30" max="65" value={form.menopauseAge} onChange={e=>setForm({...form, menopauseAge:e.target.value})} placeholder="Ex: 52" />
                      <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>Âge auquel vos règles se sont arrêtées définitivement</small>
                    </label>
                  )}
                  
                  <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '1rem', background: 'white', borderRadius: '8px', marginTop: '1rem'}}>
                    <input type="checkbox" checked={form.hormonalTreatment} onChange={e=>setForm({...form, hormonalTreatment:e.target.checked})} />
                    <span>Traitement hormonal substitutif (THS) actuel ou passé</span>
                  </label>
                  <small className="muted" style={{display: 'block', marginTop: '0.5rem', marginLeft: '2.5rem'}}>
                    Traitement pour les symptômes de la ménopause (estrogènes, progestérone)
                  </small>
                </div>
                
                <div style={{padding: '1.5rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac'}}>
                  <h4 style={{marginTop: 0, color: '#166534', fontSize: '1.1rem'}}>💊 Contraception et traitements hormonaux</h4>
                  
                  <label>
                    <span>Utilisez-vous ou avez-vous utilisé une contraception hormonale ?</span>
                    <select value={form.hormonalContraception || ''} onChange={e=>setForm({...form, hormonalContraception:e.target.value})}>
                      <option value="">-- Sélectionnez --</option>
                      <option value="never">Jamais</option>
                      <option value="past">Oui, dans le passé</option>
                      <option value="current_pill">Oui, pilule actuellement</option>
                      <option value="current_iud">Oui, DIU hormonal actuellement</option>
                      <option value="current_other">Oui, autre méthode hormonale actuellement</option>
                    </select>
                  </label>
                  
                  {(form.hormonalContraception === 'past' || form.hormonalContraception?.startsWith('current')) && (
                    <label>
                      <span>Durée totale d'utilisation (en années)</span>
                      <input type="number" min="0" max="50" value={form.hormonalContraceptionYears || ''} onChange={e=>setForm({...form, hormonalContraceptionYears:e.target.value})} placeholder="Ex: 15" />
                      <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>Estimation de la durée totale d'utilisation</small>
                    </label>
                  )}
                </div>
              </>
            ) : form.sex === 'male' ? (
              <div style={{padding: '2rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'center'}}>
                <p className="muted" style={{fontSize: '1.1rem'}}>
                  Cette section concerne la santé reproductive féminine.<br/>
                  Cliquez sur Suivant pour passer à l'étape des dépistages.
                </p>
              </div>
            ) : (
              <div style={{padding: '2rem', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fbbf24'}}>
                <p style={{marginBottom: '1rem', fontWeight: 600, color: '#92400e'}}>
                  ⚠️ Veuillez retourner à l'étape 1 pour sélectionner votre sexe à la naissance.
                </p>
                <p className="muted">
                  Cette information est nécessaire pour personnaliser vos recommandations de dépistage.
                </p>
              </div>
            )}

            <div style={{marginTop:'2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between'}}>
              <button className="btn btn-secondary" onClick={()=>setStep(5)}>← Précédent</button>
              <button className="btn" onClick={()=>setStep(7)}>Suivant →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 7: Dépistages déjà effectués */}
        {step===7 && (
          <div>
            <h3 style={{marginTop: 0}}>🔬 Dépistages déjà effectués</h3>
            <p className="muted" style={{marginBottom: '1.5rem'}}>Dates de vos derniers examens et possibilité d'uploader les comptes-rendus</p>
            
            {form.sex === 'female' && (
              <>
                <div style={{padding: '1.5rem', background: '#fef3c7', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fbbf24'}}>
                  <label>
                    <span style={{fontWeight: 600, color: '#92400e'}}>📋 Dernière mammographie</span>
                    <input 
                      type="month" 
                      value={form.screenings.mammography.date} 
                      onChange={e=>setForm({...form, screenings: {...form.screenings, mammography: {...form.screenings.mammography, date: e.target.value}}})} 
                      style={{marginBottom: '1rem'}}
                    />
                  </label>
                  <div style={{padding: '1rem', background: 'white', borderRadius: '8px'}}>
                    <label style={{marginBottom: 0}}>
                      <span style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem'}}>📎 Compte-rendu PDF (optionnel)</span>
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={e=> {
                          if(e.target.files[0]) {
                            uploadFile(e.target.files[0], 'mammography', form.screenings.mammography.date);
                            setForm({...form, screenings: {...form.screenings, mammography: {...form.screenings.mammography, reportUploaded: true}}});
                          }
                        }} 
                        style={{padding: '0.5rem', fontSize: '0.9rem'}} 
                      />
                      {form.screenings.mammography.reportUploaded && (
                        <small style={{display: 'block', marginTop: '0.5rem', color: '#059669', fontWeight: 600}}>✓ Compte-rendu uploadé</small>
                      )}
                    </label>
                  </div>
                </div>
                
                <div style={{padding: '1.5rem', background: '#fef3c7', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #fbbf24'}}>
                  <label>
                    <span style={{fontWeight: 600, color: '#92400e'}}>📋 Dernier frottis cervical (Pap test)</span>
                    <input 
                      type="month" 
                      value={form.screenings.papSmear.date} 
                      onChange={e=>setForm({...form, screenings: {...form.screenings, papSmear: {...form.screenings.papSmear, date: e.target.value}}})} 
                      style={{marginBottom: '1rem'}}
                    />
                  </label>
                  <div style={{padding: '1rem', background: 'white', borderRadius: '8px'}}>
                    <label style={{marginBottom: 0}}>
                      <span style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem'}}>📎 Compte-rendu PDF (optionnel)</span>
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={e=> {
                          if(e.target.files[0]) {
                            uploadFile(e.target.files[0], 'pap_smear', form.screenings.papSmear.date);
                            setForm({...form, screenings: {...form.screenings, papSmear: {...form.screenings.papSmear, reportUploaded: true}}});
                          }
                        }} 
                        style={{padding: '0.5rem', fontSize: '0.9rem'}} 
                      />
                      {form.screenings.papSmear.reportUploaded && (
                        <small style={{display: 'block', marginTop: '0.5rem', color: '#059669', fontWeight: 600}}>✓ Compte-rendu uploadé</small>
                      )}
                    </label>
                  </div>
                </div>
              </>
            )}
            
            <div style={{padding: '1.5rem', background: '#e0f2fe', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #38bdf8'}}>
              <label>
                <span style={{fontWeight: 600, color: '#075985'}}>📋 Dernière coloscopie</span>
                <input 
                  type="month" 
                  value={form.screenings.colonoscopy.date} 
                  onChange={e=>setForm({...form, screenings: {...form.screenings, colonoscopy: {...form.screenings.colonoscopy, date: e.target.value}}})} 
                  style={{marginBottom: '1rem'}}
                />
                <small className="muted" style={{display: 'block', marginTop: '-0.5rem', marginBottom: '1rem'}}>Laissez vide si jamais effectuée</small>
              </label>
              <div style={{padding: '1rem', background: 'white', borderRadius: '8px'}}>
                <label style={{marginBottom: 0}}>
                  <span style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem'}}>📎 Compte-rendu PDF (optionnel)</span>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={e=> {
                      if(e.target.files[0]) {
                        uploadFile(e.target.files[0], 'colonoscopy', form.screenings.colonoscopy.date);
                        setForm({...form, screenings: {...form.screenings, colonoscopy: {...form.screenings.colonoscopy, reportUploaded: true}}});
                      }
                    }} 
                    style={{padding: '0.5rem', fontSize: '0.9rem'}} 
                  />
                  {form.screenings.colonoscopy.reportUploaded && (
                    <small style={{display: 'block', marginTop: '0.5rem', color: '#059669', fontWeight: 600}}>✓ Compte-rendu uploadé</small>
                  )}
                </label>
              </div>
            </div>
            
            <div style={{padding: '1.5rem', background: '#e0f2fe', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #38bdf8'}}>
              <label>
                <span style={{fontWeight: 600, color: '#075985'}}>📋 Dernier bilan sanguin complet</span>
                <input 
                  type="month" 
                  value={form.screenings.bloodTest.date} 
                  onChange={e=>setForm({...form, screenings: {...form.screenings, bloodTest: {...form.screenings.bloodTest, date: e.target.value}}})} 
                  style={{marginBottom: '1rem'}}
                />
              </label>
              <div style={{padding: '1rem', background: 'white', borderRadius: '8px'}}>
                <label style={{marginBottom: 0}}>
                  <span style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem'}}>📎 Résultats PDF (optionnel)</span>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={e=> {
                      if(e.target.files[0]) {
                        uploadFile(e.target.files[0], 'blood_test', form.screenings.bloodTest.date);
                        setForm({...form, screenings: {...form.screenings, bloodTest: {...form.screenings.bloodTest, reportUploaded: true}}});
                      }
                    }} 
                    style={{padding: '0.5rem', fontSize: '0.9rem'}} 
                  />
                  {form.screenings.bloodTest.reportUploaded && (
                    <small style={{display: 'block', marginTop: '0.5rem', color: '#059669', fontWeight: 600}}>✓ Résultats uploadés</small>
                  )}
                </label>
              </div>
            </div>
            
            <div style={{padding: '1.5rem', background: '#f0fdf4', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #86efac'}}>
              <label>
                <span style={{fontWeight: 600, color: '#166534'}}>🦷 Dernière visite chez le dentiste</span>
                <input 
                  type="month" 
                  value={form.screenings.dentalVisit.date} 
                  onChange={e=>setForm({...form, screenings: {...form.screenings, dentalVisit: {...form.screenings.dentalVisit, date: e.target.value}}})} 
                  style={{marginBottom: '1rem'}}
                />
              </label>
              <div style={{padding: '1rem', background: 'white', borderRadius: '8px'}}>
                <label style={{marginBottom: 0}}>
                  <span style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem'}}>📎 Compte-rendu PDF (optionnel)</span>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={e=> {
                      if(e.target.files[0]) {
                        uploadFile(e.target.files[0], 'dental', form.screenings.dentalVisit.date);
                        setForm({...form, screenings: {...form.screenings, dentalVisit: {...form.screenings.dentalVisit, reportUploaded: true}}});
                      }
                    }} 
                    style={{padding: '0.5rem', fontSize: '0.9rem'}} 
                  />
                  {form.screenings.dentalVisit.reportUploaded && (
                    <small style={{display: 'block', marginTop: '0.5rem', color: '#059669', fontWeight: 600}}>✓ Compte-rendu uploadé</small>
                  )}
                </label>
              </div>
            </div>

            <div style={{marginTop:'2rem', display: 'flex', gap: '1rem', justifyContent: 'space-between'}}>
              <button className="btn btn-secondary" onClick={()=>setStep(6)}>← Précédent</button>
              <button className="btn" onClick={()=>setStep(8)}>Suivant →</button>
            </div>
          </div>
        )}

        {/* ÉTAPE 8: Expositions et risques */}
        {step===8 && (
          <div>
            <h3 style={{marginTop: 0}}>⚠️ Expositions et risques environnementaux</h3>
            <p className="muted" style={{marginBottom: '1.5rem'}}>Facteurs environnementaux et professionnels</p>
            
            <label>
              <span>Expositions professionnelles</span>
              <small className="muted" style={{display: 'block', marginTop: '0.25rem', marginBottom: '0.5rem'}}>Cochez toutes les expositions qui s'appliquent</small>
            </label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem'}}>
              {['Amiante', 'Produits chimiques', 'Radiations', 'Poussières', 'Métaux lourds', 'Pesticides'].map(exposure => (
                <label key={exposure} style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '0.75rem', background: form.occupationalExposure.includes(exposure) ? '#fee2e2' : '#f8fafc', borderRadius: '8px', border: form.occupationalExposure.includes(exposure) ? '2px solid #ef4444' : '1px solid #e2e8f0', transition: 'all 0.2s'}}>
                  <input type="checkbox" checked={form.occupationalExposure.includes(exposure)} onChange={e=>setForm({...form, occupationalExposure: toggleArrayItem(form.occupationalExposure, exposure)})} />
                  <span style={{fontSize: '0.95rem'}}>{exposure}</span>
                </label>
              ))}
            </div>
            
            <label>
              <span>Exposition au soleil</span>
              <select value={form.sunExposure} onChange={e=>setForm({...form, sunExposure:e.target.value})}>
                <option value="">-- Sélectionnez --</option>
                <option value="minimal">Minimale (principalement en intérieur)</option>
                <option value="moderate">Modérée (activités extérieures occasionnelles)</option>
                <option value="high">Élevée (travail ou loisirs en extérieur fréquents)</option>
                <option value="very_high">Très élevée (exposition intense régulière)</option>
              </select>
            </label>
            
            <label>
              <span>Statut vaccinal</span>
              <select value={form.vaccinationStatus} onChange={e=>setForm({...form, vaccinationStatus:e.target.value})}>
                <option value="">-- Sélectionnez --</option>
                <option value="up_to_date">À jour</option>
                <option value="partial">Partiellement à jour</option>
                <option value="unknown">Ne sais pas</option>
                <option value="not_vaccinated">Non vacciné</option>
              </select>
            </label>
            
            <label>
              <span>Voyages récents à l'étranger (optionnel)</span>
              <input type="text" value={form.travelHistory} onChange={e=>setForm({...form, travelHistory:e.target.value})} placeholder="Ex: Afrique de l'Ouest 2024, Asie du Sud-Est..." />
              <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>Peut influencer certaines recommandations de dépistage</small>
            </label>
            
            <div style={{marginTop: '2rem', padding: '1.5rem', background: '#f7fafc', borderRadius: '12px'}}>
              <label style={{marginBottom: 0}}>
                <span style={{display: 'block', marginBottom: '0.75rem'}}>📎 Documents médicaux (optionnel)</span>
                <input type="file" onChange={e=>e.target.files[0] && uploadFile(e.target.files[0])} style={{padding: '0.5rem'}} />
                <small className="muted" style={{display: 'block', marginTop: '0.5rem'}}>
                  Bilans sanguins, comptes-rendus d'examens... Les fichiers sont stockés de manière chiffrée
                </small>
              </label>
            </div>

            <div style={{marginTop:'2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <button className="btn btn-secondary" onClick={()=>setStep(7)} style={{flex: '1', minWidth: '150px'}}>← Précédent</button>
              <button className="btn btn-success" onClick={saveDraft} style={{flex: '1', minWidth: '150px'}}>💾 Sauvegarder</button>
              <button className="btn" onClick={submit} style={{flex: '2', minWidth: '200px'}}>✓ Voir mes recommandations</button>
            </div>
          </div>
        )}
      </div>
      
      <div className="card" style={{textAlign: 'center'}}>
        <p className="muted" style={{marginBottom: 0}}>
          🔒 Vos données sont chiffrées et sécurisées • ⚕️ Ce service ne remplace pas un avis médical
        </p>
      </div>
    </div>
  );
}
