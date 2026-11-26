// Bonus temporaires de la presale, hors contrat (le contrat est immuable) : pris sur
// l'allocation Marketing et livres au TGE avec le vesting de la presale. Affichage seulement :
// la liste des beneficiaires est calculee on-chain (events TokensBought) apres la periode.
// Decision du 31/10/2026 : +50 % des JOOB achetes, achat >= 20 USDT, + 25 % pour les achats anterieurs.
export const PROMO = {
  name: 'Flash Weekend Bonus',
  start: '2026-10-31T00:00:00Z',
  end: '2026-11-02T14:00:00Z',
  bonusBps: 5000,
  minUsd: 20,
  earlyBonusBps: 2500,
};

/** Promo en cours a l'instant nowSec (secondes, Number ou BigInt), sinon null. */
export function activePromo(nowSec, promo = PROMO) {
  const now = Number(nowSec) * 1000;
  const start = Date.parse(promo.start);
  const end = Date.parse(promo.end);
  if (Number.isNaN(start) || Number.isNaN(end) || now < start || now >= end) return null;
  return { ...promo, endSec: BigInt(Math.floor(end / 1000)) };
}

// Bonus « Fair Share » (decision du 05/11/2026) : 5 JOOB par dollar achete, des 1 $, a partir de `start`
// et jusqu'a ce que le montant leve atteigne `capRaisedUsd` (objectif de listing). Corrige l'ecart des petits
// acheteurs (pas de bonus de volume sous 100 $). Hors contrat : pris sur l'allocation Airdrop, livre au TGE
// avec le vesting de la presale. Un achat compte en entier si le montant leve avant lui est sous le plafond.
export const SALES_BONUS = {
  name: 'Fair Share Bonus',
  start: '2026-11-05T13:00:00Z',
  // Premier bloc BSC a partir de `start` (verifie le 24/11/2026) : evite la recherche par dichotomie.
  startBlock: 131821014,
  joobPerUsd: 5,
  capRaisedUsd: 25000,
  // Mise a jour de la liste a heures fixes (UTC), pour limiter les lectures du RPC d'archive.
  refreshHoursUtc: [2, 14],
  // En cas d'echec de lecture, nouvel essai apres ce delai (secondes).
  retryAfterErrorSec: 900,
};

// « Airdrop Booster » (decision du 26/11/2026) : les wallets des campagnes listees qui achetent au moins
// `minUsd` au total dans la presale (achats lus depuis SALES_BONUS.start, aucun n'avait achete avant) voient
// leur recompense multipliee par `multiplier`. Hors contrat : le supplement est pris sur l'allocation Airdrop
// et livre au TGE avec le vesting de la campagne. Statut calcule on-chain par /api/sales-bonus.
export const AIRDROP_BOOSTER = {
  name: 'Airdrop Booster',
  campaigns: ['zealy', 'meme-contest'],
  minUsd: 50,
  multiplier: 2,
  end: '2027-01-13T14:00:00Z', // fin de la presale
};

/** Secondes jusqu'a la prochaine mise a jour prevue (refreshHoursUtc). */
export function secondsToNextRefresh(nowMs = Date.now(), hours = SALES_BONUS.refreshHoursUtc) {
  const now = new Date(nowMs);
  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const slots = [...hours, ...hours.map((h) => h + 24)].map((h) => day + h * 3600_000).filter((t) => t > nowMs);
  return Math.max(60, Math.ceil((Math.min(...slots) - nowMs) / 1000));
}

/** Libelle public des heures de mise a jour, ex. « 02:00 and 14:00 UTC ». */
export const REFRESH_LABEL = `${SALES_BONUS.refreshHoursUtc.map((h) => `${String(h).padStart(2, '0')}:00`).join(' and ')} UTC`;

/** Bonus actif a nowSec si le montant leve (USD, Number) est encore sous le plafond, sinon null. */
export function activeSalesBonus(nowSec, raisedUsd, bonus = SALES_BONUS) {
  const start = Date.parse(bonus.start) / 1000;
  if (Number(nowSec) < start || raisedUsd >= bonus.capRaisedUsd) return null;
  return { ...bonus, leftUsd: bonus.capRaisedUsd - raisedUsd };
}
