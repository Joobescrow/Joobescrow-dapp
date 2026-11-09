// Grille de frais par montant (decision du 07/11/2026 : 5 / 3 / 2 %, seuils 1 000 et 10 000).
// Seule source de la grille : aucune valeur de frais codee en dur ailleurs.
// Les taux reels sont toujours relus on-chain avant creation (lib/feeTierCheck.js).
import { ethers } from 'ethers';
import {
  CONTRACT_5_PERCENT,
  CONTRACT_3_PERCENT,
  CONTRACT_2_PERCENT,
  CONTRACT_8_PERCENT,
  CONTRACT_10_PERCENT,
} from './instances';

// Jetons acceptes sur les contrats payants (decision du 07/11/2026), proposes dans le formulaire de creation.
export const PAID_TOKENS = ['USDT', 'USDC'];

export const FEE_MIN_USD = 1;
export const FEE_MAX_USD = 100000;

// maxUsdExclusive null = jusqu'a FEE_MAX_USD inclus (bornes on-chain inclusives).
export const FEE_TIERS = [
  { minUsd: 1, maxUsdExclusive: 1000, bps: 500, contract: CONTRACT_5_PERCENT, label: 'under $1,000' },
  { minUsd: 1000, maxUsdExclusive: 10000, bps: 300, contract: CONTRACT_3_PERCENT, label: 'deals from $1,000' },
  { minUsd: 10000, maxUsdExclusive: null, bps: 200, contract: CONTRACT_2_PERCENT, label: 'deals from $10,000' },
];

// Les 5 contrats payants, ouverts ou fermes : servent a lire les escrows, y compris ceux d'avant la migration.
export const PAID_CONTRACTS = [...new Set([
  CONTRACT_5_PERCENT,
  CONTRACT_3_PERCENT,
  CONTRACT_2_PERCENT,
  CONTRACT_8_PERCENT,
  CONTRACT_10_PERCENT,
])];

export const FEE_RANGE_MESSAGE = `Amounts from ${FEE_MIN_USD} to ${FEE_MAX_USD.toLocaleString('en-US')} USDT or USDC.`;

// Textes publics derives de la grille (aucun pourcentage ecrit a la main dans les pages).
const usd = (n) => `$${n.toLocaleString('en-US')}`;
const pct = (bps) => `${bps / 100}%`;
// « 5% under $1,000, 3% up to $10,000, 2% above »
export const FEE_GRID_TEXT = FEE_TIERS.map((t, i) => {
  if (i === 0) return `${pct(t.bps)} under ${usd(t.maxUsdExclusive)}`;
  if (t.maxUsdExclusive == null) return `${pct(t.bps)} above`;
  return `${pct(t.bps)} up to ${usd(t.maxUsdExclusive)}`;
}).join(', ');
// « 2% to 5% »
export const FEE_RANGE_TEXT = `${pct(Math.min(...FEE_TIERS.map((t) => t.bps)))} to ${pct(Math.max(...FEE_TIERS.map((t) => t.bps)))}`;
// Ligne publique validee par le fondateur (07/11/2026).
export const FEE_PUBLIC_LINE = `Escrow fees: ${FEE_GRID_TEXT}. Taken from the provider's payout, no fee for the client.`;
// Tranche de montant d'un palier, pour les tableaux : « $1,000 to $9,999.99 ».
export function tierAmountLabel(t) {
  const max = t.maxUsdExclusive == null ? usd(FEE_MAX_USD) : `$${(t.maxUsdExclusive - 0.01).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  return `${usd(t.minUsd)} to ${max}`;
}

/** Palier pour un montant en unites du token (bigint), ou null hors de [FEE_MIN_USD, FEE_MAX_USD]. */
export function tierForUnits(units, decimals = 18) {
  const u = (usd) => ethers.parseUnits(String(usd), decimals);
  if (typeof units !== 'bigint' || units < u(FEE_MIN_USD) || units > u(FEE_MAX_USD)) return null;
  return FEE_TIERS.find((t) => units >= u(t.minUsd) && (t.maxUsdExclusive == null || units < u(t.maxUsdExclusive))) || null;
}

/** Palier pour un montant en dollars (Number ou chaine), ou null. */
export function tierForAmount(usd) {
  try {
    return tierForUnits(ethers.parseUnits(String(usd), 18), 18);
  } catch {
    return null;
  }
}
