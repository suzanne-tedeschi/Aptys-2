import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <div className="hero-section">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.5rem 1rem',
          background: 'var(--primary-light)',
          color: 'var(--primary-dark)',
          borderRadius: '999px',
          fontSize: '0.875rem',
          fontWeight: '600',
          marginBottom: '1.5rem',
          gap: '0.5rem'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          Nouvelle approche de la fertilité
        </div>
        <h1>Votre parcours fertilité,<br/>éclairé par la science</h1>
        <p>
          Aptys analyse votre profil de couple, vos examens et votre mode de vie pour générer un plan d’action clinique personnalisé et bienveillant.
        </p>
        <div style={{marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
          <Link href="/onboarding" className="btn btn-primary">
            Commencer mon bilan
          </Link>
          <a href="#how-it-works" className="btn btn-secondary">
            Comment ça marche ?
          </a>
        </div>
      </div>
      
      <div className="grid-2" id="how-it-works">
        <div className="card">
          <div style={{
            width: '48px', height: '48px', 
            background: 'var(--primary-light)', 
            borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem', color: 'var(--primary-color)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <h3>Analyse 360°</h3>
          <p>
            Nous prenons en compte les facteurs féminins, masculins et environnementaux pour une vision complète de votre fertilité.
          </p>
        </div>
        
        <div className="card">
          <div style={{
            width: '48px', height: '48px', 
            background: '#ecfdf5', 
            borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem', color: '#059669'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h3>Recommandations Cliniques</h3>
          <p>
            Recevez des conseils basés sur les dernières recommandations médicales (HAS, ESHRE) adaptés à votre situation unique.
          </p>
        </div>
      </div>
      
      <div className="card" style={{marginTop: '2rem', borderLeft: '4px solid var(--warning-color)'}}>
        <div style={{display: 'flex', gap: '1rem'}}>
          <div style={{color: 'var(--warning-color)', display: 'flex', alignItems: 'flex-start', paddingTop: '4px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <div>
            <h4 style={{marginBottom: '0.5rem'}}>Engagement Médical</h4>
            <p className="text-small text-muted" style={{marginBottom: 0}}>
              Ce service est un outil d'aide à la décision développé pour vous accompagner. 
              Il ne remplace pas une consultation médicale mais vous aide à la préparer et à optimiser votre parcours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


