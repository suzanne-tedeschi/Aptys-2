import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Onboarding() {
  const router = useRouter();
  const [lang, setLang] = useState('fr');
  const [consent, setConsent] = useState(false);

  async function handleStart(e){
    e.preventDefault();
    if(!consent){
      alert('Consentement requis pour continuer');
      return;
    }
    const res = await fetch('/api/user/create', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({language: lang}) });
    const json = await res.json();
    router.push(`/intake?userId=${json.userId}`);
  }

  return (
    <div className="container">
      <h1 className="text-center">Démarrage — Fertilité</h1>
      <div className="card">
        <h2 className="text-center mb-4">Configuration initiale</h2>
        <form onSubmit={handleStart}>
          <div className="form-group">
            <label>Langue / Language</label>
            <select value={lang} onChange={e=>setLang(e.target.value)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-group">
            <div className="warning-box">
              <div>
                <strong>🛡️ Consentement RGPD (données de fertilité)</strong>
                <p className="text-small mt-1" style={{marginBottom: 0}}>
                  Nous traitons des données de santé sensibles relatives à la fertilité. En cochant ci-dessous,
                  vous acceptez leur traitement et stockage chiffré pour générer des recommandations personnalisées.
                  Vous pouvez retirer votre consentement et demander la suppression à tout moment.
                </p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label style={{display:'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)'}}>
              <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} style={{width: '20px', height: '20px'}} />
              <span>
                J’accepte le traitement et le stockage chiffré de mes données de santé (consentement explicite)
              </span>
            </label>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-primary" type="submit">Commencer l’évaluation fertilité</button>
          </div>
        </form>
      </div>
    </div>
  );
}


