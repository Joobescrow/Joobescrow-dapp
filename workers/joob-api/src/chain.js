// Lecture des contrats d'escrow sur BNB Chain (lecture seule, aucune cle).
import { ethers } from 'ethers';
import { MULTICALL3, PAID_CONTRACTS, DEMO_CONTRACT, TOKENS, DECIMALS, STATUS, SITE, DEFAULT_CATEGORY } from './config.js';

const ESCROW = new ethers.Interface([
  'function escrowCounter() view returns (uint256)',
  'function escrows(uint256) view returns (address client, address provider, address token, uint256 amount, uint256 feeBPS, uint256 createdAt, uint256 timeoutDate, uint8 status, bool accepted)',
]);
const MC = new ethers.Interface(['function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[])']);
const SYMBOL = Object.fromEntries(Object.entries(TOKENS).map(([s, a]) => [a.toLowerCase(), s]));
const BATCH = 150; // appels par multicall

export function provider(env) {
  const urls = (env.RPC_URLS || 'https://bsc-rpc.publicnode.com').split(',').map((u) => u.trim()).filter(Boolean);
  return new ethers.JsonRpcProvider(urls[0], 56, { staticNetwork: true, batchMaxCount: 1 });
}

async function multicall(p, calls) {
  const out = [];
  for (let i = 0; i < calls.length; i += BATCH) {
    const chunk = calls.slice(i, i + BATCH);
    const data = MC.encodeFunctionData('aggregate3', [chunk.map((c) => ({ target: c.target, allowFailure: true, callData: c.data }))]);
    const raw = await p.call({ to: MULTICALL3, data });
    const [res] = MC.decodeFunctionResult('aggregate3', raw);
    out.push(...res);
  }
  return out;
}

const toEscrow = (contract, id, e) => ({
  contract: ethers.getAddress(contract),
  id: Number(id),
  client: e.client,
  provider: e.provider,
  token: SYMBOL[e.token.toLowerCase()] || e.token,
  amount: ethers.formatUnits(e.amount, DECIMALS),
  amountWei: e.amount.toString(),
  feePercent: Number(e.feeBPS) / 100,
  createdAt: Number(e.createdAt),
  deadline: Number(e.timeoutDate),
  status: STATUS[Number(e.status)] || `status_${e.status}`,
  statusCode: Number(e.status),
  accepted: Boolean(e.accepted),
  isDemo: contract.toLowerCase() === DEMO_CONTRACT.toLowerCase(),
});

export const dealUrl = (e, category = DEFAULT_CATEGORY) =>
  e.isDemo ? `${SITE}/deal/demo/${e.id}` : `${SITE}/deal/${category}/${e.id}?c=${e.contract}`;

/** Un escrow precis (contrat payant ou demo). */
export async function readDeal(env, contract, id) {
  const known = [...PAID_CONTRACTS, DEMO_CONTRACT].find((c) => c.toLowerCase() === String(contract).toLowerCase());
  if (!known) throw Object.assign(new Error('Unknown escrow contract'), { status: 400 });
  const c = new ethers.Contract(known, ESCROW, provider(env));
  const e = await c.escrows(BigInt(id));
  if (e.client === ethers.ZeroAddress) throw Object.assign(new Error('Escrow not found'), { status: 404 });
  const d = toEscrow(known, id, e);
  return { ...d, url: dealUrl(d) };
}

/** Tous les escrows des contrats payants (demo exclue), en 2 a 3 appels multicall. */
export async function readAllEscrows(env) {
  const p = provider(env);
  const counters = await multicall(p, PAID_CONTRACTS.map((target) => ({ target, data: ESCROW.encodeFunctionData('escrowCounter') })));
  const calls = [];
  PAID_CONTRACTS.forEach((target, i) => {
    const n = counters[i].success ? Number(ESCROW.decodeFunctionResult('escrowCounter', counters[i].returnData)[0]) : 0;
    for (let id = 1; id <= n; id++) calls.push({ target, id, data: ESCROW.encodeFunctionData('escrows', [id]) });
  });
  const res = await multicall(p, calls);
  const all = [];
  res.forEach((r, i) => {
    if (!r.success) return;
    const e = ESCROW.decodeFunctionResult('escrows', r.returnData);
    if (e.client !== ethers.ZeroAddress) all.push(toEscrow(calls[i].target, calls[i].id, e));
  });
  return all;
}

/** Reputation d'une adresse : faits on-chain uniquement. */
export function summarize(all, address) {
  const a = address.toLowerCase();
  const mine = all.filter((e) => e.client.toLowerCase() === a || e.provider.toLowerCase() === a);
  const role = () => ({ completed: 0, volume: 0n, disputes: 0, cancelled: 0, active: 0 });
  const roles = { provider: role(), client: role() };
  const cps = new Set();
  let first = 0;
  for (const e of mine) {
    const k = e.provider.toLowerCase() === a ? 'provider' : 'client';
    const r = roles[k];
    if (e.statusCode === 2 || e.statusCode === 4) { r.completed++; r.volume += BigInt(e.amountWei); }
    if (e.statusCode === 3 || e.statusCode === 4) r.disputes++;
    if (e.statusCode === 5) r.cancelled++;
    if (e.statusCode === 1 || e.statusCode === 3) r.active++;
    if (e.statusCode !== 5) cps.add((k === 'provider' ? e.client : e.provider).toLowerCase());
    if (!first || e.createdAt < first) first = e.createdAt;
  }
  const fmt = (r) => ({ ...r, volume: ethers.formatUnits(r.volume, DECIMALS) });
  const total = roles.provider.volume + roles.client.volume;
  return {
    address: ethers.getAddress(address),
    completedDeals: roles.provider.completed + roles.client.completed,
    volumeCompleted: ethers.formatUnits(total, DECIMALS),
    disputes: roles.provider.disputes + roles.client.disputes,
    counterparties: cps.size,
    firstDealAt: first || null,
    asProvider: fmt(roles.provider),
    asClient: fmt(roles.client),
    profileUrl: `${SITE}/u/${ethers.getAddress(address)}`,
    note: 'On-chain facts from JoobEscrow paid contracts only. The $1 demo is not counted.',
  };
}
