import '../styles.css';
import Link from 'next/link';

export default function App({ Component, pageProps }) {
  return (
    <div className="app-layout">
      <header className="main-header">
        <div className="header-content">
          <Link href="/" className="brand-logo">
            <div style={{
              width: '32px', 
              height: '32px', 
              background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px'
            }}>A</div>
            <span>Aptys</span>
          </Link>
          
          <nav style={{display: 'flex', gap: '1.5rem'}}>
            {/* Placeholder for future nav items */}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Component {...pageProps} />
      </main>

      <footer className="main-footer">
        <div className="footer-content">
          <p style={{marginBottom: '0.5rem'}}>© {new Date().getFullYear()} Aptys Health. Tous droits réservés.</p>
          <p className="text-muted text-small" style={{marginBottom: 0}}>
            Aptys est un outil d'aide à la décision et ne remplace pas un avis médical professionnel.
          </p>
        </div>
      </footer>
    </div>
  );
}
