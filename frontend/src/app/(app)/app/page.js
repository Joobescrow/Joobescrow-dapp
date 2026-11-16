import Link from 'next/link';
import { FEE_RANGE_TEXT, FEE_TIERS, tierAmountLabel } from '../../../config/feeTiers';
import { GET_PAID_PATH } from '../../../config/appEntry';
import PaySomeoneDoor from './PaySomeoneDoor';
import styles from './hub.module.css';

export const metadata = {
  title: 'Launch App | JoobEscrow',
  description: 'Pay someone or get paid with JoobEscrow: funds stay locked in an audited non-custodial contract on BNB Smart Chain until the work is approved, the deadline passes or a dispute is settled.',
  alternates: { canonical: '/app' },
};

const TRUST = ['Audited by SpyWolf', 'Non-custodial', '3-of-5 Safe multisig', 'BNB Smart Chain'];

export default function HubPage() {
  return (
    <div className={styles.hub}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>JoobEscrow app</p>
        <h1 className={styles.title}>What would you like to do?</h1>
        <p className={styles.lead}>
          Funds stay locked in an audited contract until the client releases them, the deadline passes
          or a dispute is settled. The client pays no fee.
        </p>
        <ul className={styles.trust}>
          {TRUST.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </header>

      {/* Deux entrees selon l'intention : qui paie, qui est paye */}
      <section className={styles.doors} aria-label="Start">
        <PaySomeoneDoor />
        <Link href={GET_PAID_PATH} className={`${styles.door} ${styles.doorGet}`}>
          <span className={styles.doorEyebrow}>I am getting paid</span>
          <h2>Get paid</h2>
          <p>Send your client a payment request. You see the funds locked on-chain before you start the work.</p>
          <span className={styles.doorHint}>You choose the type of deal and the amount in the next step.</span>
          <span className={styles.doorCta}>Request a payment <span aria-hidden="true">→</span></span>
        </Link>
      </section>

      <Link href="/demo" className={styles.demoStrip}>
        <span className={styles.demoTag}>Try with $1</span>
        <span className={styles.demoStripText}>Run a full escrow between two of your own wallets, 0% fee.</span>
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

    </div>
  );
}
