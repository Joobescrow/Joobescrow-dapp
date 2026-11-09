// Controle on-chain d'un palier avant creation : on ne devine jamais un taux.
// Verifie que le contrat du palier applique le bps prevu et accepte le token pour ce montant.
import { ethers } from 'ethers';
import { ESCROW_ABI } from '../config/contract';

// defaultFeeBPS mis en cache pour la session (cle = adresse du contrat en minuscules).
const feeCache = new Map();

export async function readFeeBps(contractAddress, provider) {
  const key = contractAddress.toLowerCase();
  if (feeCache.has(key)) return feeCache.get(key);
  const c = new ethers.Contract(contractAddress, ESCROW_ABI, provider);
  const bps = Number(await c.defaultFeeBPS());
  feeCache.set(key, bps);
  return bps;
}

/**
 * @returns {Promise<{ ok: boolean, bps?: number, reason?: 'read' | 'fee' | 'token' | 'bounds' }>}
 */
export async function checkTierOnChain(tier, tokenAddr, units, provider) {
  if (!tier || !provider || !tokenAddr) return { ok: false, reason: 'read' };
  let bps;
  let cfg;
  try {
    const c = new ethers.Contract(tier.contract, ESCROW_ABI, provider);
    [bps, cfg] = await Promise.all([readFeeBps(tier.contract, provider), c.tokenConfigs(tokenAddr)]);
  } catch {
    return { ok: false, reason: 'read' };
  }
  if (bps !== tier.bps) return { ok: false, reason: 'fee' };
  if (!cfg.allowed) return { ok: false, reason: 'token' };
  if (units < cfg.minAmount || units > cfg.maxAmount) return { ok: false, reason: 'bounds' };
  return { ok: true, bps };
}

export const TIER_CHECK_MESSAGES = {
  read: 'We could not confirm the fee on-chain. Please try again in a moment.',
  fee: 'This fee tier is not available right now. Please try again later.',
  token: 'This token is not accepted for this amount right now.',
  bounds: 'This amount is not accepted right now. Please try again later.',
};
