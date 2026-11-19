// Reputation d'un wallet, calculee uniquement a partir de la chaine (aucun avis, aucune note).
// On lit tous les escrows des contrats payants (escrows(i) un par un : les RPC publics ne renvoient plus
// les anciens logs), avec un cache local pour les escrows au statut definitif.
import { ethers } from 'ethers';
import { REPUTATION } from '../config/reputation';
import { symbolForToken } from './escrowContract';

const ABI = [
  'function escrowCounter() view returns (uint256)',
  'function escrows(uint256) view returns (address client, address provider, address token, uint256 amount, uint256 feeBPS, uint256 createdAt, uint256 timeoutDate, uint8 status, bool accepted)',
];
const FINAL = new Set([2, 4, 5]); // RELEASED, RESOLVED, CANCELLED : ne changent plus
const DECIMALS = 18; // USDT et USDC BEP-20

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

const loadCache = (contract) => {
  try { return JSON.parse(localStorage.getItem(`${REPUTATION.cacheKey}:${contract.toLowerCase()}`) || '{}'); } catch { return {}; }
};
const saveCache = (contract, data) => {
  try { localStorage.setItem(`${REPUTATION.cacheKey}:${contract.toLowerCase()}`, JSON.stringify(data)); } catch {}
};

/** Tous les escrows des contrats payants : [{ contract, id, client, provider, token, amount (wei, texte), feeBPS, createdAt, status }]. */
export async function readAllEscrows(provider) {
  const all = [];
  for (const contract of REPUTATION.contracts) {
    const c = new ethers.Contract(contract, ABI, provider);
    const count = Number(await c.escrowCounter());
    const cache = loadCache(contract);
    const ids = [];
    for (let id = 1; id <= count; id++) if (!cache[id]) ids.push(id);
    const fresh = await mapLimit(ids, REPUTATION.concurrency, async (id) => {
      const e = await c.escrows(id);
      return {
        contract, id,
        client: e.client, provider: e.provider, token: e.token,
        amount: e.amount.toString(), feeBPS: Number(e.feeBPS),
        createdAt: Number(e.createdAt), status: Number(e.status),
      };
    });
    for (const r of fresh) if (FINAL.has(r.status)) cache[r.id] = r;
    saveCache(contract, cache);
    const byId = new Map(fresh.map((r) => [r.id, r]));
    for (let id = 1; id <= count; id++) {
      const r = cache[id] || byId.get(id);
      if (r && r.client !== ethers.ZeroAddress) all.push({ ...r, contract });
    }
  }
  return all;
}

const emptyRole = () => ({ completed: 0, volume: 0n, disputes: 0, cancelled: 0, active: 0 });

/** Statistiques d'une adresse a partir de la liste des escrows. */
export function summarize(all, address) {
  const a = address.toLowerCase();
  const mine = all.filter((e) => e.client.toLowerCase() === a || e.provider.toLowerCase() === a);
  const roles = { provider: emptyRole(), client: emptyRole() };
  const counterparties = new Set();
  let firstAt = 0;
  for (const e of mine) {
    const role = e.provider.toLowerCase() === a ? 'provider' : 'client';
    const r = roles[role];
    if (e.status === 2 || e.status === 4) { r.completed++; r.volume += BigInt(e.amount); }
    if (e.status === 3 || e.status === 4) r.disputes++;
    if (e.status === 5) r.cancelled++;
    if (e.status === 1 || e.status === 3) r.active++;
    if (e.status !== 5) counterparties.add((role === 'provider' ? e.client : e.provider).toLowerCase());
    if (!firstAt || e.createdAt < firstAt) firstAt = e.createdAt;
  }
  const list = [...mine]
    .sort((x, y) => y.createdAt - x.createdAt)
    .map((e) => ({ ...e, role: e.provider.toLowerCase() === a ? 'provider' : 'client', symbol: symbolForToken(e.token, 'USDT') }));
  return {
    roles,
    completed: roles.provider.completed + roles.client.completed,
    volume: roles.provider.volume + roles.client.volume,
    disputes: roles.provider.disputes + roles.client.disputes,
    counterparties: counterparties.size,
    firstAt,
    list,
  };
}

export const fmtVolume = (wei) => Number(ethers.formatUnits(wei, DECIMALS)).toLocaleString('en-US', { maximumFractionDigits: 2 });
