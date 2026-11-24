import Link from 'next/link';
import styles from './marketing.module.css';
import AmbientConstellation from '../../components/AmbientConstellation';
import PresaleGlassCard from '../../components/PresaleGlassCard';
import { BSCN_ARTICLE_URL } from '../../config/links';
import HomeFaq from '../../components/HomeFaq';
import HowToBuy from '../../components/HowToBuy';
import PromoBanner from '../../components/PromoBanner';
import { AUDITS, BSCSCAN, KYC_URL, PRESALE_ADDRESSES } from '../../config/presale';
import { TOKENOMICS, fmtM } from '../../config/tokenomics';
import { HOME_APP_ENTRIES } from '../../config/appEntry';
import { FEE_RANGE_TEXT } from '../../config/feeTiers';

// Page orientee vente, epuree : un seul bouton plein par ecran (presale), une seule ligne de preuves
// sous le hero, le detail sur les pages dediees (/try, /compare, /tokenomics, /roadmap, /security, /faq).
// Plafond du contrat = vente + bonus et parrainage (163,5M JOOB).
const PRESALE_PCT = TOKENOMICS.filter((t) => t.name.startsWith('Presale')).reduce((a, t) => a + t.pct, 0);

// Utilites du token, reprises de la FAQ « What is JOOB? » (livrees progressivement, sans date garantie).
const BENEFITS = [
  { num: '01', title: 'Lower escrow fees', desc: 'Stake JOOB to cut your fees by tier, up to a full waiver at the highest tier (Escrow V5).' },
  { num: '02', title: 'Staking rewards', desc: 'Audited staking contract already deployed, opening after the TGE.' },
  { num: '03', title: 'Governance', desc: 'Vote on new categories, fee tiers and ecosystem grants.' },
];

const TRUST = [
  { label: 'Audited by SpyWolf', href: AUDITS.PRESALE },
  { label: 'KYC verified', href: KYC_URL },
  { label: '3-of-5 Safe', href: `${BSCSCAN}/address/${PRESALE_ADDRESSES.SAFE}` },
  { label: 'Verified on BscScan', href: `${BSCSCAN}/address/${PRESALE_ADDRESSES.PRESALE}#code` },
];

const META_TITLE = 'JOOB Presale Live | The token behind smart escrow | JoobEscrow';
const META_DESC = 'JOOB powers JoobEscrow, the audited non-custodial escrow live on BNB Smart Chain. Presale live, the price rises every 2 days. Contracts audited by SpyWolf, 3-of-5 Safe multisig.';

export const metadata = {
  title: META_TITLE,
  description: META_DESC,
  alternates: { canonical: '/' },
  openGraph: { title: META_TITLE, description: META_DESC, url: 'https://www.joobescrow.com/', type: 'website', images: [{ url: '/og-presale.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: META_TITLE, description: META_DESC, images: ['/og-presale.png'] },
};

export default function LandingPage() {
  return (
    <div className={styles.pageWrap}>
      <AmbientConstellation />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 28px' }}>
            <a href={BSCN_ARTICLE_URL} target="_blank" rel="noopener noreferrer" className="press-pill">
              <img src="/logos/bscnews.webp" alt="BSC News" width={30} height={30} style={{ borderRadius: 8, flexShrink: 0 }} />
              <span>Featured on <strong>BSC News</strong></span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <PromoBanner cta />
          <div className={styles.heroGrid}>
            <div className={styles.heroLeft}>
              <div className={styles.pillBadge}>
                <span className={styles.pulseDot}></span>
                <span>PRESALE LIVE · THE PRICE RISES EVERY 2 DAYS</span>
              </div>

              <h1 className={styles.heroTitle}>
                Own the token behind <span className={styles.textGradient}>smart escrow.</span>
              </h1>

              <p className={styles.heroSubtitle}>
                JOOB powers JoobEscrow, the audited non-custodial escrow live on BNB Chain. Get it at presale price, before the PancakeSwap listing.
              </p>

              <div className={styles.heroCtas}>
                <Link href="/presale" className="btn btn-primary" style={{ padding: '14px 34px', fontSize: '1rem' }}>
                  Join the Presale
                </Link>
                <Link href="/try" className="text-gradient font-bold hover:underline" style={{ fontSize: '0.98rem' }}>
                  Or try the app with $1 →
                </Link>
              </div>
            </div>

            <div className={styles.heroRight}>
              <PresaleGlassCard />
            </div>
          </div>

          {/* Bandeau de confiance unique */}
          <div className={styles.trustBar}>
            {TRUST.map((t) => (
              t.internal ? (
                <Link key={t.label} href={t.href} className={styles.trustBarItem}>
                  {t.label} <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <a key={t.label} href={t.href} target="_blank" rel="noopener noreferrer" className={styles.trustBarItem}>
                  {t.label} <span aria-hidden="true">↗</span>
                </a>
              )
            ))}
          </div>
        </div>
      </section>

      {/* L'app en ligne : les 3 entrees (Pay someone, Get paid, Pay button) */}
      <section className={styles.section} id="app">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>THE ESCROW APP</span>
            <h2 className={styles.sectionTitle}>The app is live. <span className={styles.textGradient}>Use it today.</span></h2>
          </div>
          <div className={styles.appGrid}>
            {HOME_APP_ENTRIES.map((e) => (
              <Link key={e.key} href={e.href} className={`glass-panel ${styles.appCard}`}>
                <h3 className={styles.eraTitle}>{e.title}</h3>
                <p className={styles.eraDesc}>{e.desc}</p>
                <span className={styles.appCta}>{e.cta} <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
          <p className={styles.factsLine}>
            Fees from {FEE_RANGE_TEXT}, paid by the provider. 0% for the client.{' '}
            <Link href="/compare" className="text-gradient font-bold hover:underline">Compare with the usual options →</Link>{' '}
            · <Link href="/shipped" className="text-gradient font-bold hover:underline">See everything we shipped →</Link>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
            <Link href="/app" className="btn btn-outline" style={{ padding: '12px 30px' }}>Launch app</Link>
          </div>
        </div>
      </section>

      {/* Why buy JOOB */}
      <section className={styles.section} id="why-joob">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>THE JOOB TOKEN</span>
            <h2 className={styles.sectionTitle}>Why buy JOOB?</h2>
          </div>

          <div className={styles.erasGrid}>
            {BENEFITS.map((b) => (
              <div key={b.num} className={`glass-panel ${styles.eraCard}`}>
                <div className={`${styles.eraNum} ${styles.textGradient}`}>{b.num}</div>
                <h3 className={styles.eraTitle}>{b.title}</h3>
                <p className={styles.eraDesc}>{b.desc}</p>
              </div>
            ))}
          </div>

          <p className={styles.factsLine}>
            1B fixed supply, no mint · Presale cap {fmtM(PRESALE_PCT)} JOOB · 20% at sale end, the rest over 180 days ·{' '}
            <Link href="/tokenomics" className="text-gradient font-bold hover:underline">Tokenomics →</Link>
          </p>
        </div>
      </section>

      <HowToBuy />

      {/* FAQ */}
      <section className={styles.section} id="faq">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>QUESTIONS & ANSWERS</span>
            <h2 className={styles.sectionTitle}>Before you buy</h2>
          </div>

          <HomeFaq />
        </div>
      </section>

      {/* Final Conversion Banner */}
      <section className={styles.finalCtaSection}>
        <div className={styles.container}>
          <div className={`glass-panel ${styles.referralBanner} ${styles.finalCtaBanner}`}>
            <div className={styles.finalCtaText}>
              <h2 className={styles.refTitle}>
                Get JOOB at the current price.
              </h2>
              <p className={styles.refSub}>
                Try the full escrow cycle with $1 before you decide.{' '}
                <Link href="/try" className="text-gradient font-bold hover:underline">Try it with $1 →</Link>
              </p>
            </div>
            <div className={styles.finalCtaActions}>
              <Link href="/presale" className="btn btn-primary" style={{ padding: '14px 34px', fontSize: '1rem' }}>
                Join the Presale
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
