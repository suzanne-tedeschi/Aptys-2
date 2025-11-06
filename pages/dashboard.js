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
    setRecs(json.recommendations || []);
  }

  function exportPdf(){
    // Simple client-side print as MVP
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
      <h1>Tableau de bord</h1>
      <div className="card">
        {!user && (
          <div style={{textAlign: 'center', padding: '3rem'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⏳</div>
            <p className="muted">Chargement de vos données...</p>
          </div>
        )}
        
        {user && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #e2e8f0'}}>
              <div>
                <h2 style={{marginBottom: '0.5rem', fontSize: '1.75rem'}}>Vos recommandations personnalisées</h2>
                <p className="muted" style={{marginBottom: 0}}>
                  {recs.length} recommandation{recs.length > 1 ? 's' : ''} basée{recs.length > 1 ? 's' : ''} sur votre profil de santé
                </p>
              </div>
              <button className="btn" onClick={exportPdf}>📄 Exporter PDF</button>
            </div>

            {recs.length === 0 && (
              <div style={{textAlign: 'center', padding: '3rem', background: '#f7fafc', borderRadius: '12px'}}>
                <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📋</div>
                <p className="muted">Aucune recommandation spécifique trouvée pour votre profil.</p>
                <p className="muted" style={{fontSize: '0.9rem', marginTop: '1rem'}}>
                  Complétez votre questionnaire de santé pour recevoir des recommandations personnalisées.
                </p>
              </div>
            )}

            {recs.length > 0 && (
              <div>
                {/* Statistiques rapides */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem'}}>
                  <div style={{background: '#fef3c7', padding: '1rem', borderRadius: '8px', border: '1px solid #fcd34d'}}>
                    <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#92400e'}}>{recs.filter(r => r.priority >= 4).length}</div>
                    <div style={{fontSize: '0.9rem', color: '#92400e'}}>Priorité élevée</div>
                  </div>
                  <div style={{background: '#dbeafe', padding: '1rem', borderRadius: '8px', border: '1px solid #93c5fd'}}>
                    <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#1e40af'}}>{Object.keys(groupedRecs).length}</div>
                    <div style={{fontSize: '0.9rem', color: '#1e40af'}}>Catégories</div>
                  </div>
                  <div style={{background: '#dcfce7', padding: '1rem', borderRadius: '8px', border: '1px solid #86efac'}}>
                    <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#166534'}}>{recs.length}</div>
                    <div style={{fontSize: '0.9rem', color: '#166534'}}>Total recommandations</div>
                  </div>
                </div>

                {/* Recommandations par catégorie */}
                {Object.entries(groupedRecs).map(([category, categoryRecs]) => (
                  <div key={category} style={{marginBottom: '2.5rem'}}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #e2e8f0',
                      color: '#1e293b'
                    }}>
                      {categoryLabels[category] || category}
                      <span className="badge" style={{marginLeft: '0.5rem', fontSize: '0.85rem'}}>
                        {categoryRecs.length}
                      </span>
                    </h3>
                    
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                      {categoryRecs.map((r) => (
                        <div key={r.id} style={{
                          background: 'white',
                          border: `2px solid ${priorityColors[r.priority] || '#e2e8f0'}`,
                          borderRadius: '12px',
                          padding: '1.25rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          {/* Header avec priorité */}
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem'}}>
                            <h4 style={{margin: 0, fontSize: '1.1rem', color: '#1e293b', flex: 1}}>
                              {r.name}
                            </h4>
                            <span style={{
                              background: priorityColors[r.priority] || '#e2e8f0',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}>
                              {priorityLabels[r.priority] || 'STANDARD'}
                            </span>
                          </div>

                          {/* Intervalle recommandé */}
                          <div style={{
                            background: '#f1f5f9',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                          }}>
                            <div style={{fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem'}}>
                              📅 Fréquence recommandée
                            </div>
                            <div style={{fontSize: '1rem', fontWeight: '600', color: '#1e293b'}}>
                              {r.interval}
                            </div>
                          </div>

                          {/* Justification médicale */}
                          {r.reasoning && (
                            <div style={{
                              background: '#eff6ff',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              marginBottom: '1rem',
                              borderLeft: '3px solid #3b82f6'
                            }}>
                              <div style={{fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.25rem', fontWeight: '600'}}>
                                💡 Pourquoi cette recommandation ?
                              </div>
                              <div style={{fontSize: '0.95rem', color: '#1e3a8a'}}>
                                {r.reasoning}
                              </div>
                            </div>
                          )}

                          {/* Note importante */}
                          {r.note && (
                            <div style={{
                              background: r.priority >= 4 ? '#fef2f2' : '#fefce8',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              marginBottom: '1rem',
                              borderLeft: `3px solid ${r.priority >= 4 ? '#dc2626' : '#eab308'}`
                            }}>
                              <div style={{fontSize: '0.95rem', color: r.priority >= 4 ? '#991b1b' : '#854d0e', fontWeight: '500'}}>
                                {r.note}
                              </div>
                            </div>
                          )}

                          {/* Métadonnées */}
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: '#64748b'}}>
                            <div>
                              <span>🔬 </span>
                              <strong>Niveau de preuve :</strong> {r.evidence_level}
                            </div>
                            {r.age_start && r.age_end && (
                              <div>
                                <span>📊 </span>
                                <strong>Âge :</strong> {r.age_start}-{r.age_end} ans
                              </div>
                            )}
                          </div>

                          {/* Source */}
                          <div style={{
                            marginTop: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid #e2e8f0',
                            fontSize: '0.85rem',
                            color: '#64748b'
                          }}>
                            <span>📚 </span>
                            <strong>Source :</strong> {r.source}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="warning" style={{marginTop: '2rem'}}>
              <strong>⚕️ Disclaimer médical</strong>
              <p className="muted" style={{marginBottom: 0, marginTop: '0.5rem'}}>
                Ces recommandations sont générées automatiquement sur la base des guidelines françaises (HAS, INCa, ANSM) 
                et sont fournies à titre <strong>informatif uniquement</strong>. Elles ne remplacent en aucun cas 
                une consultation médicale personnalisée. Votre médecin traitant est le seul habilité à adapter 
                ces recommandations à votre situation personnelle, vos antécédents complets et votre contexte médical global.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
