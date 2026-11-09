import Link from 'next/link';
import { instances } from '../../../config/instances';
import { FEE_RANGE_TEXT, FEE_TIERS, tierAmountLabel } from '../../../config/feeTiers';
import styles from './hub.module.css';

export const metadata = {
  title: 'Launch App | JoobEscrow',
  description: 'Open a JoobEscrow escrow in your category: funds stay locked in an audited non-custodial contract on BNB Smart Chain until the work is approved, the deadline passes or a dispute is settled.',
  alternates: { canonical: '/app' },
};

// Grille par montant (config/feeTiers.js) : toutes les categories ont les memes frais,
// fixes par le montant de l'escrow. Les categories ne servent plus qu'au vocabulaire (roles).
const CATEGORIES = Object.values(instances);

const TRUST = ['Audited by SpyWolf', 'Non-custodial', '3-of-5 Safe multisig', 'BNB Smart Chain'];

export default function HubPage() {
  return (
    <div className={styles.hub}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>JoobEscrow app</p>
        <h1 className={styles.title}>Choose your escrow</h1>
        <p className={styles.lead}>
          Pick the category that fits your deal. Funds stay locked in an audited contract until the work is approved,
          the deadline passes or a dispute is settled. The client pays no fee.
        </p>
        <ul className={styles.trust}>
          {TRUST.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </header>

      <Link href="/demo" className={styles.demo}>
        <div>
          <span className={styles.demoTag}>Demo</span>
          <h2>New here? Run a full escrow with $1</h2>
          <p>Between two of your own wallets, with $1 in USDT or USDC, 0% fee. You get back exactly what you deposit.</p>
        </div>
        <span className={styles.demoCta}>Start the demo <span aria-hidden="true">→</span></span>
      </Link>

      {/* Encadre des frais, sous la demo : grille par montant, identique pour toutes les categories */}
      <section className={styles.fees} aria-label="Fees">
        <div className={styles.feesHead}>
          <span className={styles.feesTag}>Fees</span>
          <h2>{FEE_RANGE_TEXT}, paid by the provider. 0% for the client.</h2>
          <p>The fee depends on the escrow amount, in USDT or USDC. Same grid for every category.</p>
        </div>
        <ul className={styles.feesGrid}>
          {FEE_TIERS.map((t, i) => (
            <li key={t.contract} className={styles.feesItem}>
              <span className={styles.feesPct}>{t.bps / 100}%</span>
              <span className={styles.feesRange}>
                {i === 0 ? `under $${t.maxUsdExclusive.toLocaleString('en-US')}` : tierAmountLabel(t)}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.feesNote}>
          The fee is read from the contract before you lock the funds and recorded on-chain for each escrow.{' '}
          <Link href="/security#fees">See the fee grid →</Link>
        </p>
      </section>

      <section aria-label="Categories">
        <h2 className={styles.sectionTitle}>Choose a category</h2>
        <div className={styles.grid}>
          {CATEGORIES.map((n) => (
            <Link key={n.slug} href={`/${n.slug}`} className={styles.card}>
              <span className={styles.cardName}>{n.name}</span>
              <span className={styles.cardRoles}>{n.lexicon.client} <span aria-hidden="true">↔</span> {n.lexicon.provider}</span>
              <span className={styles.cardArrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
