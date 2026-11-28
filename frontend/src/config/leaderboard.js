// Page /leaderboard : deux classements calcules depuis les achats on-chain (TokensBought), cote serveur.
// Source unique des regles affichees. Les montants sont en USDT/USDC payes, jamais une valeur du JOOB.

// Achats deja lus et verifies (somme = totalRaised), a rafraichir de temps en temps pour garder la route rapide :
// node scripts/leaderboard-snapshot.cjs (depuis frontend/). La route ne relit que les blocs suivants.
export { default as SNAPSHOT } from './presaleBuysSnapshot.json';

// Top Buyers hebdomadaire (meme regles que contracts-token/top-buyers.config.json et le worker d'alertes).
export const TOP_BUYERS = {
  name: 'Top Buyers',
  anchor: '2026-11-02T14:00:00Z', // debut de la semaine 2, une semaine = 7 jours, fin lundi 14:00 UTC
  firstWeek: 2,
  poolBps: 1000, // 10 % des achats de la semaine (hors equipe)
  poolCap: 500, // USDT
  topN: 3,
  prorataFromWeek: 5, // depuis la semaine 5 : cagnotte partagee au prorata des achats du top 3
  splitBps: [5000, 3000, 2000], // avant la semaine 5
};

// Classement des liens de parrainage (volume presale apporte par referrer).
// Pendant un concours, la fenetre et les prix du concours ; sinon le classement depuis le debut.
export const REFERRERS = {
  contests: [
    {
      name: 'Pin & Prove',
      start: '2026-11-28T00:00:00Z',
      end: '2026-12-07T14:00:00Z',
      minPurchaseUsd: 10, // achats plus petits ignores
      minUsdForUsdtPrize: 25,
      prizes: ['20 USDT + 3,500 JOOB', '15 USDT + 2,500 JOOB', '10 USDT + 1,500 JOOB'],
      rules: 'Valid entry required: a $1 escrow receipt and your referral link pinned on X for 24h. Every valid entry gets 500 JOOB. USDT prizes need at least 25 USDT brought. Tie: most distinct buyers.',
      rulesUrl: 'https://t.me/joobescrow_group',
    },
  ],
};

export const LEADERBOARD_CACHE_SEC = 600; // cache CDN de la route /api/leaderboard
