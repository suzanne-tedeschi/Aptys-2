import { useEffect, useState } from 'react';

function readQuery(){
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  return { userId: p.get('userId') };
}

export default function Dashboard(){
  const [user, setUser] = useState(null);
  const [recs, setRecs] = useState([]);
  const q = readQuery();

  useEffect(()=>{ if(q.userId) load(q.userId); }, []);

  async function load(id){
    const res = await fetch(`/api/user/${id}`);
    const json = await res.json();
    setUser(json);
    // Support both old and new data structures
    setRecs(json.recommendations || []);
    setAnalysis(json.analysis || null); // New
    setTimeline(json.timeline || []); // New
    setQuestions(json.questions_for_doctor || []); // New
  }

  const [analysis, setAnalysis] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [questions, setQuestions] = useState([]);

  function exportPdf(){
    window.print();
  }

  // Grouper les recommandations par catégorie
  const groupedRecs = recs.reduce((acc, rec) => {
    const category = rec.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(rec);
    return acc;
  }, {});

  const categoryLabels = {
    cancer: '🎗️ Dépistages des cancers',
    cardiovascular: '❤️ Santé cardiovasculaire',
    metabolic: '🔬 Dépistages métaboliques',
    bone_health: '🦴 Santé osseuse',
    dental: '🦷 Santé dentaire',
    vaccination: '💉 Vaccinations',
    eye_health: '👁️ Santé oculaire',
    other: '📋 Autres recommandations'
  };

  const priorityColors = {
    5: '#dc2626', // Rouge - Urgent
    4: '#ea580c', // Orange - Important
    3: '#3b82f6', // Bleu - Standard
    2: '#64748b', // Gris - Secondaire
    1: '#94a3b8'  // Gris clair - Optionnel
  };

  const priorityLabels = {
    5: 'PRIORITÉ ÉLEVÉE',
    4: 'IMPORTANT',
    3: 'RECOMMANDÉ',
    2: 'SECONDAIRE',
    1: 'OPTIONNEL'
  };

  return (
    <div className="container">
      <div className="dashboard-header" style={{marginBottom: '2rem', borderBottom: 'none', paddingBottom: 0}}>
        <div>
          <h1 style={{marginBottom: '0.5rem'}}>Tableau de bord</h1>
          {user && (
            <p className="text-muted" style={{marginBottom: 0}}>
              Analyse générée le {new Date().toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
        {user && <button className="btn btn-secondary" onClick={exportPdf}>📄 Exporter PDF</button>}
      </div>
      
      {!user && (
        <div className="card text-center" style={{padding: '4rem'}}>
          <div className="spinner" style={{width: '48px', height: '48px', marginBottom: '1.5rem'}}></div>
          <p className="text-muted">Chargement de vos données...</p>
        </div>
      )}
      
      {user && recs.length === 0 && (
        <div className="card text-center" style={{padding: '3rem'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📋</div>
          <p className="text-muted">Aucune recommandation spécifique trouvée pour votre profil.</p>
          <p className="text-muted text-small mt-2">
            Complétez votre questionnaire de santé pour recevoir des recommandations personnalisées.
          </p>
        </div>
      )}

      {user && recs.length > 0 && (
        <div>
          {/* Analysis Summary Section */}
          {analysis && (
            <div className="dashboard-grid">
              {/* Complexity Score Card */}
              <div className="card col-span-4" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, #fff 0%, #f0fdfa 100%)', border: '1px solid var(--primary-light)'}}>
                <h3 style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem'}}>Score de Complexité</h3>
                <div style={{position: 'relative', display: 'inline-block'}}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle cx="60" cy="60" r="54" fill="none" stroke={analysis.complexity_score > 7 ? '#ef4444' : analysis.complexity_score > 4 ? '#f59e0b' : '#10b981'} strokeWidth="10" strokeDasharray={`${analysis.complexity_score * 33.9} 339`} transform="rotate(-90 60 60)" strokeLinecap="round" />
                  </svg>
                  <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
                    <span style={{fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary-dark)', lineHeight: 1}}>{analysis.complexity_score}</span>
                    <span style={{fontSize: '1rem', color: '#94a3b8', display: 'block'}}>/10</span>
                  </div>
                </div>
                <p style={{fontSize: '0.95rem', color: 'var(--text-body)', marginTop: '1.5rem', fontStyle: 'italic'}}>
                  "{analysis.complexity_reason}"
                </p>
              </div>

              {/* Key Findings & Red Flags */}
              <div className="card col-span-8">
                <h3 className="dashboard-section-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  Synthèse Clinique
                </h3>
                <ul style={{paddingLeft: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-body)'}}>
                  {analysis.key_findings && analysis.key_findings.map((finding, i) => (
                    <li key={i} style={{marginBottom: '0.75rem', lineHeight: '1.6'}}>{finding}</li>
                  ))}
                </ul>
                
                {analysis.red_flags && analysis.red_flags.length > 0 && (
                  <div style={{background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.25rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.95rem'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Points de Vigilance
                    </div>
                    {analysis.red_flags.map((flag, i) => (
                      <div key={i} style={{fontSize: '0.9rem', color: '#7f1d1d', marginBottom: '0.5rem', paddingLeft: '1.75rem', position: 'relative'}}>
                        <span style={{position: 'absolute', left: '0.5rem', top: '0'}}>•</span>
                        <strong>{flag.title}:</strong> {flag.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          {timeline && timeline.length > 0 && (
            <div className="card mb-4">
              <h3 className="dashboard-section-title">
                <span style={{background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.5rem', borderRadius: '10px', display: 'flex'}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
                Votre Roadmap Fertilité
              </h3>
              <div style={{position: 'relative', paddingLeft: '2rem'}}>
                <div style={{position: 'absolute', left: '19px', top: '20px', bottom: '20px', width: '2px', background: 'linear-gradient(to bottom, var(--primary-color) 0%, var(--border-light) 100%)'}}></div>
                {timeline.map((step, i) => (
                  <div key={i} style={{marginBottom: '2.5rem', position: 'relative', paddingLeft: '2.5rem'}}>
                    <div style={{position: 'absolute', left: '0', top: '0', width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '2px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary-color)', zIndex: 2}}>
                      {i + 1}
                    </div>
                    <h4 style={{fontSize: '1.2rem', color: 'var(--primary-dark)', marginBottom: '1rem', marginTop: '0.25rem', textTransform: 'capitalize'}}>{step.phase}</h4>
                    <div className="card" style={{marginBottom: 0, borderLeft: '4px solid var(--primary-color)', boxShadow: 'none', background: 'var(--bg-subtle)'}}>
                      <ul style={{margin: 0, paddingLeft: '1.2rem'}}>
                        {step.actions.map((action, j) => (
                          <li key={j} style={{marginBottom: '0.5rem', color: 'var(--text-body)'}}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions for Doctor */}
          {questions && questions.length > 0 && (
            <div className="card mb-4" style={{background: '#f8fafc', border: '1px dashed #cbd5e1'}}>
              <h3 className="dashboard-section-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Questions à poser à votre médecin
              </h3>
              <div style={{display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
                {questions.map((q, i) => (
                  <div key={i} style={{background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'flex-start'}}>
                    <span style={{background: '#e0f2fe', color: '#0369a1', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0}}>?</span>
                    <span style={{color: 'var(--text-body)', fontStyle: 'italic'}}>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistiques rapides */}
          <div className="dashboard-stats mb-4">
            <div className="stat-card urgent">
              <div className="stat-value">{recs.filter(r => r.priority >= 4).length}</div>
              <div className="stat-label">Priorité élevée</div>
            </div>
            <div className="stat-card info">
              <div className="stat-value">{Object.keys(groupedRecs).length}</div>
              <div className="stat-label">Catégories</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{recs.length}</div>
              <div className="stat-label">Total recommandations</div>
            </div>
          </div>

          {/* Recommandations par catégorie */}
          {Object.entries(groupedRecs).map(([category, categoryRecs]) => (
            <div key={category} className="rec-category">
              <h3 className="dashboard-section-title capitalize">
                {categoryLabels[category] || category}
                <span className="pill pill-soft" style={{fontSize: '0.85rem', marginLeft: '0.5rem'}}>
                  {categoryRecs.length}
                </span>
              </h3>
              
              <div className="rec-list">
                {categoryRecs.map((r) => (
                  <div key={r.id} className={`rec-card priority-${r.priority}`}>
                    {/* Header avec priorité */}
                    <div className="rec-header">
                      <h4 className="rec-title capitalize">{r.recommendation_name || r.name}</h4>
                      <span className="rec-badge" style={{
                        background: priorityColors[r.priority] || '#e2e8f0',
                        color: 'white'
                      }}>
                        {priorityLabels[r.priority] || 'STANDARD'}
                      </span>
                    </div>

                    <div className="rec-content">
                      {/* Intervalle recommandé */}
                      {(r.interval_recommendation || r.interval) && (
                        <div className="rec-section frequency">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span className="capitalize">{r.interval_recommendation || r.interval}</span>
                        </div>
                      )}

                      {/* Justification médicale */}
                      {r.reasoning && (
                        <div className="rec-section reasoning">
                          <div style={{fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)'}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            Pourquoi ?
                          </div>
                          <div>{r.reasoning}</div>
                        </div>
                      )}

                      {/* Note importante */}
                      {r.note && (
                        <div className={`rec-section note ${r.priority >= 4 ? 'urgent' : ''}`}>
                          <div style={{fontWeight: '700', marginBottom: '0.25rem'}}>Note importante</div>
                          <div>{r.note}</div>
                        </div>
                      )}
                    </div>

                    {/* Métadonnées */}
                    <div className="rec-meta">
                      <div className="rec-meta-item">
                        <strong>Niveau de preuve :</strong> {r.evidence_level}
                      </div>
                      {r.age_start && r.age_end && (
                        <div className="rec-meta-item">
                          <strong>Âge :</strong> {r.age_start}-{r.age_end} ans
                        </div>
                      )}
                      <div className="rec-meta-item" style={{marginLeft: 'auto'}}>
                        <strong>Source :</strong> {r.source_reference || r.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="warning-box mt-4">
            <div>
              <strong>⚕️ Disclaimer médical</strong>
              <p className="text-small mt-1" style={{marginBottom: 0}}>
                Ces recommandations sont générées automatiquement sur la base des guidelines françaises (HAS, INCa, ANSM) 
                et sont fournies à titre <strong>informatif uniquement</strong>. Elles ne remplacent en aucun cas 
                une consultation médicale personnalisée. Votre médecin traitant est le seul habilité à adapter 
                ces recommandations à votre situation personnelle, vos antécédents complets et votre contexte médical global.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

