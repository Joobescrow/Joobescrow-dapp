import Link from 'next/link';
import ComparisonTable from '../../../components/ComparisonTable';

// Comparatif deplace de l'accueil (donnees : config/comparison.js).
export const metadata = {
  title: 'Smart escrow vs the usual options | JoobEscrow',
  description: 'JoobEscrow compared with Upwork, Fiverr, Freelancer.com and Escrow.com: who holds the funds, fees, crypto payments and disputes.',
  alternates: { canonical: '/compare' },
};

export default function ComparePage() {
  return (
    <div style={{ padding: '40px 0 24px' }}>
      <ComparisonTable />
      <p style={{ textAlign: 'center', margin: '8px 16px 48px' }}>
        <Link href="/try" className="text-gradient font-bold hover:underline">Try the full cycle with $1 →</Link>
        {' · '}
        <Link href="/app" className="text-gradient font-bold hover:underline">Launch app →</Link>
      </p>
    </div>
  );
}
