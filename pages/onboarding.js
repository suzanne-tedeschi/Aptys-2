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
    // create user minimal
    const res = await fetch('/api/user/create', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({lang}) });
    const json = await res.json();
    router.push(`/intake?userId=${json.userId}`);
  }

  return (
    <div className="container">
      <h1>Démarrage</h1>
      <div className="card">
        <h2 style={{fontSize: '1.75rem', marginBottom: '2rem'}}>Configuration initiale</h2>
        <form onSubmit={handleStart}>
          <label>
            <span style={{fontSize: '1.1rem'}}>🌍 Langue / Language</span>
            <select value={lang} onChange={e=>setLang(e.target.value)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
          
          <div className="warning">
            <strong>🔒 Consentement RGPD</strong>
            <p className="muted">
              En cochant ci-dessous, vous acceptez que vos données de santé soient stockées de manière 
              chiffrée pour générer des recommandations personnalisées. Vous pouvez retirer votre 
              consentement et supprimer vos données à tout moment.
            </p>
          </div>
          
          <label style={{display:'flex', alignItems: 'center', cursor: 'pointer', padding: '1rem', background: '#f7fafc', borderRadius: '12px'}}>
            <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
            <span style={{fontSize: '1.05rem'}}>
              J'accepte le stockage et le traitement de mes données (consentement explicite)
            </span>
          </label>
          
          <div style={{marginTop:'2rem', textAlign: 'center'}}>
            <button className="btn" type="submit">Commencer →</button>
          </div>
        </form>
      </div>
    </div>
  );
}
