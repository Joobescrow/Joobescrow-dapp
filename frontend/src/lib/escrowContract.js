// Contrat reel d'un escrow et symbole de son token (migration vers la grille par montant).
// Un escrow payant ne vit plus forcement sur le contrat de sa categorie : les ids sont propres
// a chaque contrat, et un lien /deal ou ?escrow= porte le contrat dans ?c=<adresse>.
import { ethers } from 'ethers';
import { PAID_CONTRACTS } from '../config/feeTiers';
import { TOKEN_ADDRESSES } from '../config/contract';

const PAID_SET = new Map(PAID_CONTRACTS.map((a) => [a.toLowerCase(), a]));

export function isPaidContract(addr) {
  return typeof addr === 'string' && PAID_SET.has(addr.toLowerCase());
}

/**
 * Contrat a lire pour un escrow ouvert par lien.
 * - demo : toujours le contrat de la demo (c ignore) ;
 * - sans c : contrat historique de la categorie (anciens liens) ;
 * - avec c : seulement l'un des contrats payants connus, sinon null (lien refuse).
 */
export function resolveEscrowContract(niche, c) {
  if (!niche) return null;
  if (niche.isDemo || !c) return niche.contractAddress;
  return PAID_SET.get(String(c).toLowerCase()) || null;
}

/** Contrats sur lesquels lire les soldes et escrows d'un wallet pour une niche. */
export function contractsForNiche(niche) {
  if (!niche) return [];
  return niche.isDemo ? [niche.contractAddress] : PAID_CONTRACTS;
}

// Symbole deduit de l'adresse du token : un token ferme sur un contrat y a un symbole vide.
const SYMBOL_BY_TOKEN = Object.fromEntries(Object.entries(TOKEN_ADDRESSES).map(([sym, addr]) => [addr.toLowerCase(), sym]));

export function symbolForToken(tokenAddr, fallback) {
  if (tokenAddr && SYMBOL_BY_TOKEN[tokenAddr.toLowerCase()]) return SYMBOL_BY_TOKEN[tokenAddr.toLowerCase()];
  return fallback || 'tokens';
}

/** Cle unique d'un escrow (contrat + id), pour les caches, cles React et URLs. */
export function escrowKey(contractAddr, id) {
  return `${String(contractAddr).toLowerCase()}-${id}`;
}

/** Lien public /deal d'un escrow (porte le contrat pour un escrow payant). */
export function dealPath(nicheSlug, id, contractAddr, isDemo) {
  const base = `/deal/${nicheSlug}/${id}`;
  return !isDemo && contractAddr ? `${base}?c=${ethers.getAddress(contractAddr)}` : base;
}
