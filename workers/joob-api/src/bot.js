// Bot Telegram JoobEscrow : lecture seule. Ne touche jamais aux fonds, ne demande jamais de wallet ni de signature.
// Webhook : POST /telegram (en-tete secret verifie). Alertes /track : cron chaque minute (index.js).
import { ethers } from 'ethers';
import { SITE, PAID_CONTRACTS, OFFICIAL } from './config.js';
import { fees, paylink, deal, reputation } from './api.js';
import { readAllEscrows } from './chain.js';

const MAX_TRACKED = 5; // wallets suivis par conversation
const SAFE_LINE = `Official site: joobescrow.com only. We never ask you to connect a wallet in Telegram.`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const day = (s) => (s ? new Date(s * 1000).toUTCString().slice(5, 16) : 'n/a');

export async function send(env, chatId, html) {
  // Jeton nettoye : un retour a la ligne ajoute a l'enregistrement (PowerShell) casserait l'URL.
  const token = (env.TELEGRAM_BOT_TOKEN || '').trim();
  if (env.DRY_RUN === '1' || !token) { console.log(`[DRY_RUN] to ${chatId}:\n${html}`); return; }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) console.error(`Telegram sendMessage ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const HELP = [
  '<b>JoobEscrow bot</b>: escrow on BNB Chain, read-only from here.',
  '',
  '/fees: fee grid',
  '/deal &lt;deal link&gt;: status of an escrow',
  '/rep &lt;address&gt;: on-chain track record of a wallet',
  '/getpaid &lt;address&gt; [amount] [USDT|USDC]: payment request link for your client',
  '/track &lt;address&gt;: alerts when an escrow of this wallet changes',
  '/untrack &lt;address&gt;, /mytracks',
  '',
  `Try the full cycle with $1: ${SITE}/try`,
  SAFE_LINE,
].join('\n');

// --- Suivi des wallets (KV) : track:<chatId> = [adresses] ; watchers:<adresse> = [chatIds] ; snap:<adresse> = etats connus
async function getJson(env, key, def) { try { return JSON.parse((await env.TRACK.get(key)) || 'null') ?? def; } catch { return def; } }
const putJson = (env, key, v) => env.TRACK.put(key, JSON.stringify(v));

async function track(env, chatId, address) {
  const a = ethers.getAddress(address);
  const mine = await getJson(env, `track:${chatId}`, []);
  if (mine.includes(a)) return `Already tracking ${short(a)}.`;
  if (mine.length >= MAX_TRACKED) return `You can track up to ${MAX_TRACKED} wallets. Use /untrack first.`;
  mine.push(a);
  await putJson(env, `track:${chatId}`, mine);
  const w = await getJson(env, `watchers:${a}`, []);
  if (!w.includes(chatId)) { w.push(chatId); await putJson(env, `watchers:${a}`, w); }
  const all = await getJson(env, 'tracked', []);
  if (!all.includes(a)) { all.push(a); await putJson(env, 'tracked', all); }
  return `Tracking ${short(a)}. We will message you here when one of its escrows is created, accepted, released, disputed, settled, cancelled, or when its deadline passes. Wallet data is public on BNB Chain: tracking reveals nothing private.`;
}

async function untrack(env, chatId, address) {
  const a = ethers.getAddress(address);
  await putJson(env, `track:${chatId}`, (await getJson(env, `track:${chatId}`, [])).filter((x) => x !== a));
  const w = (await getJson(env, `watchers:${a}`, [])).filter((c) => c !== chatId);
  await putJson(env, `watchers:${a}`, w);
  if (!w.length) await putJson(env, 'tracked', (await getJson(env, 'tracked', [])).filter((x) => x !== a));
  return `Stopped tracking ${short(a)}.`;
}

// --- Commandes
function parseDealArg(args) {
  const text = args.join(' ');
  const m = text.match(/\/deal\/[a-z]+\/(\d+)(?:\?c=(0x[a-fA-F0-9]{40}))?/);
  if (m) return { id: m[1], contract: m[2] || null, demo: /\/deal\/demo\//.test(text) };
  if (args.length >= 2 && ethers.isAddress(args[0]) && /^\d+$/.test(args[1])) return { contract: args[0], id: args[1] };
  if (args.length === 1 && /^\d+$/.test(args[0])) return { id: args[0], contract: null };
  return null;
}

const dealText = (d) => [
  `<b>Escrow #${d.id}</b> · ${esc(d.status)}${d.isDemo ? ' (demo)' : ''}`,
  `Amount: ${esc(d.amount)} ${esc(d.token)} · fee ${d.feePercent}% (paid by the provider)`,
  `Client: <code>${d.client}</code>`,
  `Provider: <code>${d.provider}</code>`,
  `Deadline: ${day(d.deadline)} · accepted: ${d.accepted ? 'yes' : 'no'}`,
  d.url,
].join('\n');

async function cmdDeal(env, args) {
  const p = parseDealArg(args);
  if (!p) return 'Send a deal link, for example: /deal https://www.joobescrow.com/deal/pro/10?c=0x56c2…';
  if (p.demo) return dealText(await deal(env, { contract: '0x28b80688749958241E14Fa8181274AE0E649eC0B', id: p.id }));
  if (p.contract) return dealText(await deal(env, { contract: p.contract, id: p.id }));
  // Numero seul : les numeros sont propres a chaque contrat, on montre toutes les correspondances.
  const found = [];
  for (const c of PAID_CONTRACTS) { try { found.push(await deal(env, { contract: c, id: p.id })); } catch { /* absent sur ce contrat */ } }
  if (!found.length) return `No escrow #${esc(p.id)} found. Send the full deal link to be sure.`;
  return found.map(dealText).join('\n\n') + (found.length > 1 ? '\n\nSeveral contracts have this number: use the full deal link to pick one.' : '');
}

async function cmdRep(env, args) {
  if (!args[0] || !ethers.isAddress(args[0])) return 'Usage: /rep 0x…';
  const r = await reputation(env, { address: args[0] });
  return [
    `<b>Track record of ${short(r.address)}</b>`,
    `${r.completedDeals} completed deals · ${r.volumeCompleted} USD · ${r.counterparties} different counterparties · ${r.disputes} disputes`,
    `As provider: ${r.asProvider.completed} completed · as client: ${r.asClient.completed} completed`,
    `First deal: ${day(r.firstDealAt)}`,
    r.profileUrl,
    'On-chain facts only. The $1 demo is not counted.',
  ].join('\n');
}

function cmdGetPaid(args) {
  if (!args[0] || !ethers.isAddress(args[0])) return 'Usage: /getpaid 0xYourWallet 250 USDT\nThe amount is optional: without it, your client enters it.';
  const amount = args[1] && /^\d/.test(args[1]) ? args[1] : undefined;
  const token = (amount ? args[2] : args[1]) || 'USDT';
  const { url } = paylink({ provider: args[0], amount, token });
  return [
    '<b>Your payment request link</b>',
    url,
    'Send it to your client. They open it on joobescrow.com, check your address and lock the funds. You get paid when they release, or after the deadline once you accepted.',
    `A button for your website: ${SITE}/pay-button`,
  ].join('\n');
}

function cmdFees() {
  const f = fees();
  return ['<b>Fees</b>', `Client: ${f.client}`, ...f.provider.map((t) => `Provider: ${t.percent}% from $${t.fromUsd.toLocaleString('en-US')} to $${t.toUsd.toLocaleString('en-US')}`), `Tokens: ${f.tokens.join(', ')}`, `Try with $1 at 0% fee: ${f.demo}`].join('\n');
}

export async function handleUpdate(env, update) {
  const msg = update.message || update.channel_post;
  if (!msg || typeof msg.text !== 'string') return;
  const chatId = msg.chat.id;
  const [rawCmd, ...args] = msg.text.trim().split(/\s+/);
  const cmd = rawCmd.split('@')[0].toLowerCase();
  let reply;
  // Alertes personnelles : uniquement en conversation privee (sinon elles partiraient a tout le groupe).
  const privateOnly = ['/track', '/untrack', '/mytracks'];
  if (msg.chat.type !== 'private' && privateOnly.includes(cmd)) {
    await send(env, chatId, `Personal alerts work in a private chat only. Open @${env.BOT_USERNAME || 'our bot'} and send ${cmd} there.`);
    return;
  }
  try {
    switch (cmd) {
      case '/start': case '/help': reply = HELP; break;
      case '/fees': reply = cmdFees(); break;
      case '/deal': reply = await cmdDeal(env, args); break;
      case '/rep': reply = await cmdRep(env, args); break;
      case '/getpaid': reply = cmdGetPaid(args); break;
      case '/track': reply = args[0] && ethers.isAddress(args[0]) ? await track(env, chatId, args[0]) : 'Usage: /track 0x…'; break;
      case '/untrack': reply = args[0] && ethers.isAddress(args[0]) ? await untrack(env, chatId, args[0]) : 'Usage: /untrack 0x…'; break;
      case '/mytracks': {
        const mine = await getJson(env, `track:${chatId}`, []);
        reply = mine.length ? `Tracked wallets:\n${mine.map((a) => `<code>${a}</code>`).join('\n')}` : 'No wallet tracked. Use /track 0x…';
        break;
      }
      default:
        if (msg.chat.type !== 'private') return; // en groupe, on ne repond qu'aux commandes connues
        reply = HELP;
    }
  } catch (err) {
    reply = `Sorry, we could not read the chain right now (${esc(err.message)}). Please try again in a minute.`;
  }
  await send(env, chatId, reply);
}

// --- Alertes : compare l'etat des escrows des wallets suivis avec le dernier etat connu
const EVENTS = {
  new: (e) => `New escrow #${e.id}: ${e.amount} ${e.token} locked.`,
  accepted: (e) => `Escrow #${e.id} accepted by the provider. Work can start.`,
  completed: (e) => `Escrow #${e.id} released: ${e.amount} ${e.token} sent to the provider's balance (fee ${e.feePercent}%). The provider can now withdraw it on joobescrow.com.`,
  disputed: (e) => `A dispute was opened on escrow #${e.id}. Share your evidence in the encrypted chat on joobescrow.com.`,
  resolved: (e) => `The dispute on escrow #${e.id} was settled. Check your balance on joobescrow.com and withdraw.`,
  cancelled: (e) => `Escrow #${e.id} was cancelled before acceptance. The client can withdraw the refund on joobescrow.com.`,
  deadline: (e) => `The deadline of escrow #${e.id} has passed. The provider can now claim the payment, or the client can release it.`,
};

export async function runAlerts(env) {
  const tracked = await getJson(env, 'tracked', []);
  if (!tracked.length) return 'no tracked wallet';
  const all = await readAllEscrows(env);
  const now = Math.floor(Date.now() / 1000);
  let sent = 0;
  for (const addr of tracked) {
    const a = addr.toLowerCase();
    const mine = all.filter((e) => e.client.toLowerCase() === a || e.provider.toLowerCase() === a);
    const snap = await getJson(env, `snap:${addr}`, null);
    const next = {};
    const msgs = [];
    for (const e of mine) {
      const key = `${e.contract}-${e.id}`;
      const late = e.statusCode === 1 && e.accepted && e.deadline > 0 && now > e.deadline;
      const state = `${e.statusCode}${e.accepted ? 'a' : ''}${late ? 'l' : ''}`;
      next[key] = state;
      if (!snap) continue; // premier passage : on memorise sans alerter
      const prev = snap[key];
      if (prev === state) continue;
      const role = e.provider.toLowerCase() === a ? 'provider' : 'client';
      let ev = null;
      if (!prev) ev = 'new';
      else if (e.statusCode === 2) ev = 'completed';
      else if (e.statusCode === 3) ev = 'disputed';
      else if (e.statusCode === 4) ev = 'resolved';
      else if (e.statusCode === 5) ev = 'cancelled';
      else if (late && !prev.includes('l')) ev = 'deadline';
      else if (e.accepted && !prev.includes('a')) ev = 'accepted';
      if (ev) msgs.push(`${EVENTS[ev](e)} (you are the ${role} of ${short(addr)})\n${e.isDemo ? '' : `${SITE}/deal/pro/${e.id}?c=${e.contract}`}`);
    }
    const changed = !snap || Object.keys(next).length !== Object.keys(snap).length || Object.entries(next).some(([k, v]) => snap[k] !== v);
    if (changed) await putJson(env, `snap:${addr}`, next);
    if (!msgs.length) continue;
    const watchers = await getJson(env, `watchers:${addr}`, []);
    for (const chatId of watchers) {
      await send(env, chatId, `${msgs.join('\n\n')}\n\n${SAFE_LINE}`);
      sent++;
    }
  }
  return `checked ${tracked.length} wallets, ${sent} alerts`;
}

export { HELP, OFFICIAL };
