import ReputationClient from './ReputationClient';

export const metadata = {
  title: 'Escrow reputation | JoobEscrow',
  description: 'Public JoobEscrow track record of a wallet: completed deals, volume, disputes and counterparties, read directly from the smart contracts.',
  robots: { index: false, follow: false },
};

export default async function ReputationPage({ params }) {
  const { address } = await params;
  return <ReputationClient address={address} />;
}
