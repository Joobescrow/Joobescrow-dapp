// Instantane des achats de la presale (TokensBought) pour la page /leaderboard : src/config/presaleBuysSnapshot.json.
// L'historique ne change plus : la route /api/leaderboard ne relit que les blocs posterieurs a l'instantane.
// Lecture SEQUENTIELLE obligatoire : NodeReal renvoie des listes vides, sans erreur, sur des requetes paralleles.
//
// Usage (depuis frontend/) : node scripts/leaderboard-snapshot.cjs
// RPC : BSC_LOGS_RPC_URL de .env.local (jamais affichee).
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const ROOT = path.join(__dirname, '..');
for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
if (!process.env.BSC_LOGS_RPC_URL) throw new Error('BSC_LOGS_RPC_URL absente de .env.local');

const PRESALE = '0xd3F3598Ff8efB2cF6643488e66e8df683804F63d';
const START_BLOCK = 127798805; // 15/10/2026 14:00 UTC (config/leaderboard.js)
const TOPIC = '0xbd37c6c26f83ab804758436c263701c75879733903991b821180916fd6726eb6';
const WINDOW = 49000;
const SAFETY = 30; // blocs laisses de cote en tete de chaine (reorganisations)
const OUT = path.join(ROOT, 'src', 'config', 'presaleBuysSnapshot.json');
const EVENT = new ethers.Interface([
  'event TokensBought(address indexed buyer, uint256 paid, uint256 tokens, bool useUSDT, address indexed referrer, uint256 referralBonus)',
]);

(async () => {
  const p = new ethers.JsonRpcProvider(process.env.BSC_LOGS_RPC_URL, 56, { staticNetwork: true, batchMaxCount: 1 });
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { toBlock: START_BLOCK - 1, buys: [] };
  const to = (await p.getBlockNumber()) - SAFETY;
  const buys = [...prev.buys];
  for (let a = prev.toBlock + 1; a <= to; a += WINDOW) {
    const logs = await p.getLogs({ address: PRESALE, topics: [TOPIC], fromBlock: a, toBlock: Math.min(to, a + WINDOW - 1) });
    for (const l of logs) {
      const ev = EVENT.parseLog({ topics: l.topics, data: l.data });
      const { timestamp } = await p.getBlock(l.blockNumber);
      buys.push({
        buyer: ev.args.buyer.toLowerCase(),
        referrer: ev.args.referrer.toLowerCase(),
        usd: Number(ethers.formatUnits(ev.args.paid, 18)),
        time: timestamp,
        block: l.blockNumber,
        tx: l.transactionHash,
      });
    }
  }
  // Verification : la somme des achats doit egaler totalRaised du contrat (sinon des logs manquent).
  const raised = Number(ethers.formatUnits(await new ethers.Contract(PRESALE, ['function totalRaised() view returns (uint256)'], p).totalRaised(), 18));
  const sum = buys.reduce((s, b) => s + b.usd, 0);
  if (Math.abs(raised - sum) > 0.01) throw new Error(`Instantane incomplet : ${sum} lus, totalRaised ${raised}. Rien n'est ecrit.`);
  fs.writeFileSync(OUT, `${JSON.stringify({ toBlock: to, buys }, null, 1)}\n`);
  console.log(`${buys.length} achats jusqu'au bloc ${to}, ${sum.toFixed(2)} USD = totalRaised. Ecrit : src/config/presaleBuysSnapshot.json`);
})().catch((e) => { console.error(e.shortMessage || e.message); process.exit(1); });
