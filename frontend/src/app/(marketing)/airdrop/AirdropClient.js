'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import styles from './airdrop.module.css';
import { SALES_BONUS, REFRESH_LABEL, AIRDROP_BOOSTER } from '../../../config/promo';
import Link from 'next/link';
import { TELEGRAM_URL, TELEGRAM_CHANNEL_URL } from '../../../config/links';

const fmt = (n) => n.toLocaleString('en-US');
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const dateLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// Listes figees des campagnes (config/airdrop/*.json) : une recherche par adresse sur toutes les campagnes
// (pas de connexion wallet), puis une liste publique par campagne, la plus recente en premier.
export default function AirdropClient({ campaigns: frozen }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState(frozen[0].id);
  const [live, setLive] = useState(null);
  // Airdrop Booster : total achete par wallet (null = pas encore lu ou indisponible).
  const [bought, setBought] = useState(null);

  // Campagne en cours, calculee on-chain par /api/sales-bonus (mise a jour a heures fixes, config/promo.js).
  useEffect(() => {
    let alive = true;
    // Pas de repli dans le navigateur : les RPC publics n'ont plus l'historique (liste incomplete).
    fetch('/api/sales-bonus')
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d.started) return;
        if (!d.error) setBought(new Map((d.buyers || []).map((b) => [b.address, b.usd])));
        const startLabel = new Date(SALES_BONUS.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
        setLive({
          id: 'fair-share',
          live: true,
          campaign: d.campaign,
          entries: d.entries || [],
          labelHeader: 'Bought',
          unavailable: Boolean(d.error),
          rule: `${SALES_BONUS.joobPerUsd} bonus JOOB for every $1 bought, any amount, from ${startLabel} until $${SALES_BONUS.capRaisedUsd / 1000}K raised.${d.capReached ? ' Target reached, the list is final.' : ''}`,
          delivery: 'From the Airdrop allocation, delivered at TGE with the presale vesting: 20% at the end of the sale, then linear over 180 days.',
        });
        setTab('fair-share');
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const campaigns = live ? [live, ...frozen] : frozen;

  const check = (e) => {
    e.preventDefault();
    const a = query.trim();
    if (!ethers.isAddress(a.toLowerCase())) { setResult({ invalid: true }); return; }
    const hits = campaigns
      .map((c) => ({ c, entry: c.entries.find((x) => x.address === a.toLowerCase()) }))
      .filter((h) => h.entry);
    setResult({ hits, total: hits.reduce((s, h) => s + h.entry.joob, 0) });
  };

  // Statut du booster pour une entree d'une campagne eligible : null si la campagne n'est pas concernee.
  const boostOf = (c, entry) => {
    if (!AIRDROP_BOOSTER.campaigns.includes(c.id)) return null;
    const usd = bought?.get(entry.address) ?? 0;
    return { known: bought !== null, on: usd >= AIRDROP_BOOSTER.minUsd, usd, boosted: entry.joob * AIRDROP_BOOSTER.multiplier };
  };
  const boostLabel = (b) => (!b.known ? '…' : b.on ? `x${AIRDROP_BOOSTER.multiplier} = ${fmt(b.boosted)} JOOB` : `Buy ${AIRDROP_BOOSTER.minUsd} USDT to get ${fmt(b.boosted)}`);

  const current = campaigns.find((c) => c.id === tab) ?? campaigns[0];
  const currentBoost = AIRDROP_BOOSTER.campaigns.includes(current.id);
  const total = current.entries.reduce((a, e) => a + e.joob, 0);

  return (
    <div className={styles.wrap}>
      <div className={`glass-panel ${styles.card}`}>
        <h2 className={styles.cardTitle}>Search by address</h2>
        <form onSubmit={check} className={styles.form} style={{ marginTop: 0 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="0x… wallet address" aria-label="Wallet address" className={styles.input} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        {result && (result.invalid ? (
          <p className={styles.muted}>Invalid address.</p>
        ) : result.hits.length ? (
          <div className={styles.ok}>
            {result.hits.map(({ c, entry }) => (
              <p key={c.id} style={{ margin: '4px 0' }}>
                {c.campaign}: {fmt(entry.joob)} JOOB{entry.metric !== undefined ? ` (${fmt(entry.metric)} ${c.metricHeader})` : ''}{entry.label ? `, ${entry.label}` : ''}
                {boostOf(c, entry) && <><br /><b>{AIRDROP_BOOSTER.name}: {boostLabel(boostOf(c, entry))}</b></>}
              </p>
            ))}
            {result.hits.length > 1 && <p style={{ margin: '8px 0 0' }}>Total: {fmt(result.total)} JOOB</p>}
          </div>
        ) : (
          <p className={styles.muted}>This address is not on any list.</p>
        ))}
      </div>

      {/* Lauréats : les annonces (dates de claim, TGE) passent par le Telegram officiel */}
      <div className={styles.tgNotice} role="note">
        <strong>Airdrop winners:</strong> claim dates and TGE updates are announced on our official Telegram.{' '}
        <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">Channel</a>{' · '}
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">Group</a>.{' '}
        We never ask for your seed phrase or ask you to connect a wallet in Telegram.
      </div>
      {/* Airdrop Booster : recompense multipliee pour les laureats qui achetent dans la presale */}
      <div className={styles.booster} role="note">
        <strong>{AIRDROP_BOOSTER.name}: double your reward.</strong>{' '}
        Zealy and Meme Contest winners: buy at least {AIRDROP_BOOSTER.minUsd} USDT of JOOB in the presale (in total, until the end of the sale on January 13, 2027) with the wallet listed below, and your reward is multiplied by {AIRDROP_BOOSTER.multiplier}. Search your address to see your status, updated daily at {REFRESH_LABEL}. The extra JOOB come from the Airdrop allocation and follow the same vesting.{' '}
        <Link href="/presale?utm_source=site&utm_campaign=airdrop_booster">Go to the presale</Link>
      </div>
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.tabs} role="tablist">
          {campaigns.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={c.id === current.id} onClick={() => setTab(c.id)} className={`${styles.tab} ${c.id === current.id ? styles.tabActive : ''}`}>
              {c.campaign}
            </button>
          ))}
        </div>
        <p className={styles.sub}>{current.rule}</p>
        <div className={styles.stats}>
          <div><span>Wallets</span><b>{current.entries.length}</b></div>
          <div><span>Total</span><b>{fmt(total)} JOOB</b></div>
          <div><span>{current.live ? 'Status' : 'List frozen'}</span><b>{current.unavailable ? 'List refreshing, check back soon' : current.live ? `Updated daily at ${REFRESH_LABEL}` : dateLabel(current.snapshot)}</b></div>
        </div>
        <p className={styles.sub} style={{ marginTop: 14 }}>{current.delivery}</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>{current.labelHeader}</th>
                <th>Wallet</th>
                {current.metricHeader && <th>{current.metricHeader}</th>}
                <th>JOOB</th>
                {currentBoost && <th>{AIRDROP_BOOSTER.name}</th>}
              </tr>
            </thead>
            <tbody>
              {current.entries.map((e, i) => (
                <tr key={e.address}>
                  <td>{i + 1}</td>
                  <td>{e.label}</td>
                  <td className={styles.mono}>{short(e.address)}</td>
                  {current.metricHeader && <td>{fmt(e.metric)}</td>}
                  <td className={styles.amount}>{fmt(e.joob)}</td>
                  {currentBoost && <td className={boostOf(current, e).on ? styles.amount : styles.boostOff}>{boostLabel(boostOf(current, e))}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
