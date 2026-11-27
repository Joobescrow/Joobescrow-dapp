import Link from 'next/link';
import styles from './marketing.module.css';
import './marketing-utilities.css';
import dict from '../../i18n/en.json';

import { Web3Provider } from '../../context/Web3Context';
import MarketingHeader from '../../components/MarketingHeader';
import HideOnFocusPages from '../../components/HideOnFocusPages';
import { TELEGRAM_URL, TELEGRAM_CHANNEL_URL, X_URL } from '../../config/links';


export default function MarketingLayout({ children }) {
  return (
    <Web3Provider>
      <div className="mkt-site" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <MarketingHeader />

        <main className="mkt-main" style={{ flex: 1 }}>
          {children}
        </main>

        <HideOnFocusPages>
        <footer className={styles.footer}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Link href="/" className={styles.footerLogo}>
                <img src="/logo.svg" alt="" width={32} height={32} />
                <span>JoobEscrow</span>
              </Link>
              <p className={styles.footerTagline}>
                Secure every payment. Funds stay locked on-chain until the work is approved, the deadline passes or a dispute is settled.
              </p>
            </div>

            <div className={styles.footerCol}>
              <h3>Product</h3>
              <Link href="/app">Launch App</Link>
              <Link href="/try">Try it with $1</Link>
              <Link href="/shipped">What we shipped</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/security">Audits &amp; security</Link>
              <Link href="/faq">FAQ</Link>
            </div>

            <div className={styles.footerCol}>
              <h3>JOOB token</h3>
              <Link href="/presale">Presale</Link>
              <Link href="/tokenomics">Tokenomics</Link>
              <Link href="/roadmap">Roadmap</Link>
              <Link href="/whitepaper">Whitepaper</Link>
              <Link href="/airdrop">Airdrop</Link>
            </div>

            <div className={styles.footerCol}>
              <h3>Community</h3>
              <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">Telegram announcements</a>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">Telegram group</a>
              <a href={X_URL} target="_blank" rel="noopener noreferrer">X (Twitter)</a>
              <a href="mailto:contact@joobescrow.com" title="contact@joobescrow.com">Email</a>
              <Link href="/media-kit">Media kit</Link>
            </div>
          </div>

          <nav className={styles.footerLegal} aria-label="Legal">
            <Link href="/presale-terms">Presale terms</Link>
            <Link href="/risks">Risks</Link>
            <Link href="/compliance">Compliance</Link>
            <Link href="/terms">Terms</Link>
          </nav>

          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} JoobEscrow · Built on BNB Chain</span>
            <span>Only official site: joobescrow.com · We never DM first</span>
          </div>
        </footer>
        </HideOnFocusPages>
      </div>
    </Web3Provider>
  );
}
