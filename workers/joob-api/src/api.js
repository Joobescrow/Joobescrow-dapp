// API publique en lecture seule (api.joobescrow.com) : frais, deal, reputation, lien de paiement.
// Aucune ecriture, aucune cle : tout est lu sur BNB Chain ou calcule a partir de la config.
import { ethers } from 'ethers';
import { FEE_TIERS, SITE, CATEGORIES, DEFAULT_CATEGORY, AMOUNT_MIN, AMOUNT_MAX, AMOUNT_PATTERN, REF_PATTERN, TOKENS, OFFICIAL } from './config.js';
import { readDeal, readAllEscrows, summarize } from './chain.js';

const CACHE_SECONDS = 60;

export function fees() {
  return {
    client: '0%',
    provider: FEE_TIERS.map((t) => ({ percent: t.bps / 100, fromUsd: t.from, toUsd: t.to, contract: t.contract })),
    tokens: Object.keys(TOKENS),
    amountRange: { min: AMOUNT_MIN, max: AMOUNT_MAX },
    demo: `${SITE}/try`,
  };
}

/** Lien de paiement prerempli (meme format que le site). Renvoie { url } ou leve une erreur 400. */
export function paylink({ provider, amount, token, category, ref }) {
  const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
  if (!provider || !ethers.isAddress(provider)) throw bad('provider must be a valid BNB Chain address');
  const cat = (category || DEFAULT_CATEGORY).toLowerCase();
  if (!CATEGORIES.includes(cat)) throw bad(`category must be one of: ${CATEGORIES.join(', ')}`);
  const tok = (token || 'USDT').toUpperCase();
  if (!TOKENS[tok]) throw bad('token must be USDT or USDC');
  const params = new URLSearchParams({ pay: ethers.getAddress(provider) });
  if (amount !== undefined && amount !== null && String(amount).trim() !== '') {
    const a = String(amount).trim();
    if (!AMOUNT_PATTERN.test(a) || Number(a) < AMOUNT_MIN || Number(a) > AMOUNT_MAX) throw bad(`amount must be between ${AMOUNT_MIN} and ${AMOUNT_MAX}, 2 decimals at most`);
    params.set('amount', a);
  }
  params.set('token', tok);
  if (ref) {
    if (!REF_PATTERN.test(ref)) throw bad('ref: letters, numbers, spaces, dots, hyphens and underscores, 64 characters at most');
    params.set('ref', ref);
  }
  return { url: `${SITE}/${cat}?${params.toString()}`, note: 'The client opens this link, checks the details and locks the funds in their own wallet.' };
}

export async function deal(env, { contract, id }) {
  if (!contract || !/^\d+$/.test(String(id || ''))) throw Object.assign(new Error('contract and numeric id are required'), { status: 400 });
  return readDeal(env, contract, id);
}

export async function reputation(env, { address }) {
  if (!address || !ethers.isAddress(address)) throw Object.assign(new Error('address must be a valid BNB Chain address'), { status: 400 });
  return summarize(await readAllEscrows(env), address);
}

export const index = () => ({
  name: 'JoobEscrow public API',
  description: 'Read-only API for the JoobEscrow non-custodial escrow on BNB Chain. No keys, no writes.',
  endpoints: {
    'GET /fees': 'Fee grid by deal size',
    'GET /deal?contract=<address>&id=<id>': 'Status, amount and parties of one escrow',
    'GET /reputation?address=<address>': 'On-chain track record of a wallet (paid contracts only)',
    'GET /paylink?provider=<address>&amount=<optional>&token=<USDT|USDC>&category=<optional>&ref=<optional>': 'Pre-filled payment request link',
  },
  docs: `${SITE}/agents.md`,
  official: { site: SITE, ...OFFICIAL },
});

/** Routeur HTTP de l'API, avec cache court sur les lectures on-chain. */
export async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const q = Object.fromEntries(url.searchParams);
  const headers = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': `public, max-age=${CACHE_SECONDS}` };
  const json = (body, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers });
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'GET') return json({ error: 'Read-only API: GET only' }, 405);

  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  let res;
  try {
    switch (url.pathname) {
      case '/': res = json(index()); break;
      case '/fees': res = json(fees()); break;
      case '/paylink': res = json(paylink(q)); break;
      case '/deal': res = json(await deal(env, q)); break;
      case '/reputation': res = json(await reputation(env, q)); break;
      default: return json({ error: 'Not found', see: '/' }, 404);
    }
  } catch (err) {
    return json({ error: err.message }, err.status || 502);
  }
  ctx.waitUntil(cache.put(request, res.clone()));
  return res;
}
