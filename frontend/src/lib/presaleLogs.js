import { ethers } from 'ethers';
import { PRESALE_ADDRESSES } from '../config/presale';
import SNAPSHOT from '../config/presaleBuysSnapshot.json';
import { SAFE_SIGNERS } from '../config/team';
import { SALES_BONUS } from '../config/promo';

// Lecture des achats de la presale (evenements TokensBought), partagee par les routes /api (serveur)
// et par le repli dans le navigateur quand le serveur ne peut pas joindre de RPC.
const TOPIC_BOUGHT = '0xbd37c6c26f83ab804758436c263701c75879733903991b821180916fd6726eb6';
const EVENT = new ethers.Interface([
  'event TokensBought(address indexed buyer, uint256 paid, uint256 tokens, bool useUSDT, address indexed referrer, uint256 referralBonus)',
]);
const PRESALE_READ = ['function totalRaised() view returns (uint256)'];
const WINDOW = 49_000; // publicnode et NodeReal : 50 000 blocs maximum par eth_getLogs
// Achats de l'equipe (Safe et signataires) exclus des listes publiques.
const TEAM = new Set([PRESALE_ADDRESSES.SAFE, ...SAFE_SIGNERS.map((x) => x.address)].map((a) => a.toLowerCase()));
const buyerOf = (l) => `0x${l.topics[1].slice(26)}`.toLowerCase();

/** Premier RPC qui repond parmi `urls`. headers : en-tetes facultatifs (serveur). */
export async function firstProvider(urls, headers = {}) {
  for (const url of urls.filter(Boolean)) {
    try {
      const req = new ethers.FetchRequest(url);
      for (const [k, v] of Object.entries(headers)) req.setHeader(k, v);
      const p = new ethers.JsonRpcProvider(req, 56, { staticNetwork: true, batchMaxCount: 1 });
      await p.getBlockNumber();
      return p;
    } catch { /* RPC suivant */ }
  }
  throw new Error('No RPC available');
}

/** Derniers achats hors equipe, du plus recent au plus ancien. */
export async function recentBuys(p, wanted = 6, maxWindows = 40) {
  const head = await p.getBlockNumber();
  const logs = [];
  for (let i = 0, to = head; i < maxWindows && logs.length < wanted; i += 1, to -= WINDOW) {
    const found = await p.getLogs({ address: PRESALE_ADDRESSES.PRESALE, topics: [TOPIC_BOUGHT], fromBlock: to - WINDOW + 1, toBlock: to });
    logs.unshift(...found.filter((l) => !TEAM.has(buyerOf(l))));
  }
  const times = new Map();
  const out = [];
  for (const l of logs.slice(-wanted).reverse()) {
    if (!times.has(l.blockNumber)) times.set(l.blockNumber, (await p.getBlock(l.blockNumber)).timestamp);
    const ev = EVENT.parseLog({ topics: l.topics, data: l.data });
    const b = ev.args.buyer;
    out.push({
      buyer: `${b.slice(0, 6)}…${b.slice(-4)}`,
      usd: Number(ethers.formatUnits(ev.args.paid, 18)),
      joob: Number(ethers.formatUnits(ev.args.tokens, 18)),
      tx: l.transactionHash,
      time: times.get(l.blockNumber),
    });
  }
  return out;
}

/** Beneficiaires du bonus Fair Share (config/promo.js), calcules depuis la blockchain. */
export async function fairShare(p, nowSec = Math.floor(Date.now() / 1000)) {
  const startSec = Date.parse(SALES_BONUS.start) / 1000;
  const base = { campaign: SALES_BONUS.name, joobPerUsd: SALES_BONUS.joobPerUsd, capRaisedUsd: SALES_BONUS.capRaisedUsd, start: SALES_BONUS.start };
  if (nowSec < startSec) return { ...base, entries: [], started: false };
  // Achats verifies (instantane + blocs suivants lus un par un, somme = totalRaised) : voir verifiedBuys.
  const all = await verifiedBuys(p);
  const buys = all.filter((b) => b.time >= startSec);
  // Montant leve avant le premier achat de la periode.
  let raised = all.filter((b) => b.time < startSec).reduce((s, b) => s + b.usd, 0);
  // Total achete par wallet depuis `start`, plafond Fair Share ignore (Airdrop Booster, config/promo.js).
  const bought = new Map();
  for (const b of buys) if (!TEAM.has(b.buyer)) bought.set(b.buyer, (bought.get(b.buyer) || 0) + b.usd);
  const byWallet = new Map();
  for (const b of buys) {
    const eligible = raised < SALES_BONUS.capRaisedUsd && !TEAM.has(b.buyer);
    raised += b.usd;
    if (!eligible) continue;
    const w = byWallet.get(b.buyer) || { address: b.buyer, usd: 0 };
    w.usd += b.usd;
    byWallet.set(b.buyer, w);
  }
  const entries = [...byWallet.values()]
    .map((w) => ({ address: w.address, joob: Math.floor(w.usd * SALES_BONUS.joobPerUsd), label: `$${w.usd.toLocaleString('en-US', { maximumFractionDigits: 2 })} bought` }))
    .sort((a, b) => b.joob - a.joob);
  const buyers = [...bought].map(([address, usd]) => ({ address, usd: Math.round(usd * 100) / 100 }));
  return { ...base, entries, buyers, started: true, capReached: raised >= SALES_BONUS.capRaisedUsd, updatedAt: nowSec };
}

// RPC : cote serveur, la cle NodeReal privee (BSC_LOGS_RPC_URL, variable Vercel non publique) passe en premier.
export const SERVER_RPCS = () => [process.env.BSC_LOGS_RPC_URL, 'https://bsc-rpc.publicnode.com', 'https://bsc-dataseed.bnbchain.org'];
export const BROWSER_RPCS = ['https://bsc-rpc.publicnode.com'];
// Fair Share remonte au 05/11 : il faut un RPC d'archive. Les RPC publics renvoient une liste vide sans erreur
// sur les anciens blocs, ce qui afficherait une liste fausse : pas de repli public ici.
export const ARCHIVE_RPCS = () => [process.env.BSC_LOGS_RPC_URL];

/**
 * Tous les achats de la presale, dans l'ordre des blocs : instantane fige (config/presaleBuysSnapshot.json,
 * scripts/leaderboard-snapshot.cjs) + blocs posterieurs lus UN PAR UN (NodeReal renvoie des listes vides,
 * sans erreur, sur des requetes paralleles). Controle : somme = totalRaised du contrat, sinon erreur
 * (jamais de liste fausse). Equipe comprise : chaque usage filtre avec TEAM.
 */
export async function verifiedBuys(p) {
  const head = await p.getBlockNumber();
  const buys = [...SNAPSHOT.buys];
  for (let a = SNAPSHOT.toBlock + 1; a <= head; a += WINDOW) {
    const logs = await p.getLogs({ address: PRESALE_ADDRESSES.PRESALE, topics: [TOPIC_BOUGHT], fromBlock: a, toBlock: Math.min(head, a + WINDOW - 1) });
    for (const l of logs) {
      const ev = EVENT.parseLog({ topics: l.topics, data: l.data });
      buys.push({ buyer: ev.args.buyer.toLowerCase(), referrer: ev.args.referrer.toLowerCase(), usd: Number(ethers.formatUnits(ev.args.paid, 18)), time: (await p.getBlock(l.blockNumber)).timestamp });
    }
  }
  const raised = Number(ethers.formatUnits(await new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_READ, p).totalRaised(), 18));
  if (Math.abs(raised - buys.reduce((s, b) => s + b.usd, 0)) > 0.01) throw new Error('incomplete logs');
  return buys;
}

/**
 * Page /leaderboard (config/leaderboard.js) : classement Top Buyers de la semaine en cours, classement de
 * tous les temps et classement des liens de parrainage (concours en cours, sinon depuis le debut).
 * Equipe (Safe et signataires) exclue comme acheteur et comme parrain ; parrainage de soi-meme ignore.
 */
export async function leaderboard(p, cfg, nowSec = Math.floor(Date.now() / 1000)) {
  const { TOP_BUYERS, REFERRERS } = cfg;
  const buys = await verifiedBuys(p);
  const r2 = (x) => Math.round(x * 100) / 100;
  const rank = (list, key) => {
    const m = new Map();
    for (const b of list) {
      const k = b[key];
      const e = m.get(k) || { address: k, usd: 0, count: 0, buyers: new Set(), reachedAt: 0 };
      e.usd += b.usd; e.count += 1; e.buyers.add(b.buyer); e.reachedAt = b.time;
      m.set(k, e);
    }
    return [...m.values()];
  };
  const pub = (e) => ({ address: ethers.getAddress(e.address), usd: r2(e.usd), purchases: e.count, buyers: e.buyers.size });
  const notTeam = buys.filter((b) => !TEAM.has(b.buyer));

  // Tous les temps
  const allTime = rank(notTeam, 'buyer').sort((a, b) => b.usd - a.usd || a.reachedAt - b.reachedAt);

  // Semaine Top Buyers en cours
  const WEEK = 7 * 86400;
  const anchor = Date.parse(TOP_BUYERS.anchor) / 1000;
  const k = Math.max(0, Math.floor((nowSec - anchor) / WEEK));
  const wStart = anchor + k * WEEK;
  const wEnd = wStart + WEEK;
  const weekNumber = TOP_BUYERS.firstWeek + k;
  const inWeek = notTeam.filter((b) => b.time >= wStart && b.time < wEnd);
  const weekVolume = inWeek.reduce((s, b) => s + b.usd, 0);
  const pool = Math.min(TOP_BUYERS.poolCap, (weekVolume * TOP_BUYERS.poolBps) / 10000);
  const week = rank(inWeek, 'buyer').sort((a, b) => b.usd - a.usd || a.reachedAt - b.reachedAt);
  const prorata = weekNumber >= TOP_BUYERS.prorataFromWeek;
  const topTotal = week.slice(0, TOP_BUYERS.topN).reduce((s, e) => s + e.usd, 0);
  const weekRows = week.slice(0, 10).map((e, i) => ({
    ...pub(e),
    prize: i < TOP_BUYERS.topN ? r2(prorata ? (topTotal ? (pool * e.usd) / topTotal : 0) : (pool * TOP_BUYERS.splitBps[i]) / 10000) : 0,
  }));

  // Parrainage : concours en cours (ou le dernier termine depuis moins de 7 jours), sinon depuis le debut
  const contest = REFERRERS.contests.find((c) => nowSec >= Date.parse(c.start) / 1000 && nowSec < Date.parse(c.end) / 1000 + WEEK) || null;
  const cStart = contest ? Date.parse(contest.start) / 1000 : 0;
  const cEnd = contest ? Date.parse(contest.end) / 1000 : Infinity;
  const refBuys = buys.filter((b) => b.referrer !== ZERO && b.referrer !== b.buyer && !TEAM.has(b.referrer) && !TEAM.has(b.buyer)
    && b.time >= cStart && b.time < cEnd && (!contest || b.usd >= contest.minPurchaseUsd));
  const referrers = rank(refBuys, 'referrer').sort((a, b) => b.usd - a.usd || b.buyers.size - a.buyers.size || a.reachedAt - b.reachedAt);

  return {
    updatedAt: nowSec,
    totals: { raised: r2(buys.reduce((s, b) => s + b.usd, 0)), buyers: new Set(buys.map((b) => b.buyer)).size, purchases: buys.length },
    allTime: allTime.slice(0, 10).map(pub),
    week: { number: weekNumber, start: wStart, end: wEnd, volume: r2(weekVolume), pool: r2(pool), prorata, topN: TOP_BUYERS.topN, rows: weekRows },
    referrers: {
      contest: contest ? { name: contest.name, start: contest.start, end: contest.end, ended: nowSec >= cEnd, prizes: contest.prizes, rules: contest.rules, rulesUrl: contest.rulesUrl, minUsdForUsdtPrize: contest.minUsdForUsdtPrize } : null,
      rows: referrers.slice(0, 10).map(pub),
    },
  };
}
const ZERO = '0x0000000000000000000000000000000000000000';
