import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
            <div className="hero-section">
        <h1>Aptys</h1>
        <p style={{fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto'}}>
          Votre assistant de prévention santé personnalisée.<br/>
          Découvrez les dépistages et examens recommandés selon vos antécédents.
        </p>
      </div>
      
      <div className="card">
        <h3 style={{marginTop: 0, textAlign: 'center'}}>Bienvenue</h3>
        <p style={{textAlign: 'center', fontSize: '1.05rem'}}>
          Outil d'aide à la prévention basé sur vos antécédents personnels et familiaux.
        </p>
        <p style={{textAlign: 'center'}} className="muted">
          Ne remplace pas l'avis médical — consultez toujours votre professionnel de santé.
        </p>
        <div style={{textAlign: 'center', marginTop: '2rem'}}>
          <Link href="/onboarding" className="btn">Commencer mon évaluation</Link>
        </div>
      </div>
      
      <div className="card">
        <div className="warning">
          <strong>⚠️ Information importante</strong>
          <p className="muted" style={{marginBottom: 0}}>
            Ce service est un prototype à but informatif. Il ne constitue pas un dispositif médical 
            et ne remplace en aucun cas une consultation médicale professionnelle.
          </p>
        </div>
      </div>
    </div>
  );
}
