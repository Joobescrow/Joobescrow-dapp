import DealClient from './DealClient';

export const metadata = {
  title: 'Escrow deal | JoobEscrow',
  description: 'Read-only view of a JoobEscrow deal: amount locked, parties, status and deadline, read directly from the smart contract.',
  robots: { index: false, follow: false },
};

export default async function DealPage({ params, searchParams }) {
  const { niche, id } = await params;
  // ?c=<contrat> : contrat reel de l'escrow (grille par montant). Absent sur les anciens liens.
  const { c } = (await searchParams) || {};
  return <DealClient niche={niche} id={id} c={typeof c === 'string' ? c : null} />;
}
