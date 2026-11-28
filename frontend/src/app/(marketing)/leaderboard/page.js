import Link from 'next/link';
import styles from '../marketing.module.css';
import LeaderboardClient from './LeaderboardClient';

export const metadata = {
  title: 'Presale Leaderboard | JoobEscrow',
  description: 'JOOB presale leaderboards read from the blockchain: Top Buyers of the week with the live USDT prize pool, top referral links and all-time buyers.',
  alternates: { canonical: '/leaderboard' },
};

export default function LeaderboardPage() {
  return (
    <div className={styles.section} style={{ paddingTop: '56px', paddingBottom: '90px' }}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTag}>JOOB PRESALE</span>
          <h1 className={styles.sectionTitle}>Leaderboard</h1>
        </div>

        <LeaderboardClient />

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: 28, lineHeight: 1.6 }}>
          Every ranking is computed from the presale contract events, team wallets excluded. Updated every 10 minutes.
          <br />
          <Link href="/presale" className="text-gradient font-bold">Buy JOOB or get your referral link</Link>
        </p>
      </div>
    </div>
  );
}
