'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../airdrop/airdrop.module.css';

const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const usd = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (s) => new Date(s * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const scan = (a) => `https://bscscan.com/address/${a}`;

function Countdown({ end }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, end - now);
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  return <>{left ? `${d}d ${h}h ${m}m` : 'ended'}</>;
}

function Table({ rows, cols }) {
  if (!rows.length) return <p className={styles.muted}>No entry yet. The top spot is open.</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr><th>#</th><th>Wallet</th>{cols.map((c) => <th key={c.h}>{c.h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.address}>
              <td>{i + 1}</td>
              <td className={styles.mono}><a href={scan(r.address)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{short(r.address)}</a></td>
              {cols.map((c) => <td key={c.h} className={c.cls ? styles[c.cls] : undefined}>{c.v(r, i)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Classements calcules par /api/leaderboard (on-chain, cache 10 minutes, config/leaderboard.js).
export default function LeaderboardClient() {
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('week');
  // #referrers ou #all ouvre l'onglet correspondant (liens depuis /presale).
  useEffect(() => {
    const t = setTimeout(() => {
      const h = window.location.hash.slice(1);
      if (h === 'referrers') setTab('ref');
      else if (h === 'all') setTab('all');
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    let alive = true;
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((x) => { if (alive) setD(x); })
      .catch(() => { if (alive) setD({ error: 'unavailable' }); });
    return () => { alive = false; };
  }, []);

  if (!d) return <div className={`glass-panel ${styles.card}`}><p className={styles.muted} style={{ margin: 0 }}>Reading the blockchain…</p></div>;
  if (d.error) return <div className={`glass-panel ${styles.card}`}><p className={styles.muted} style={{ margin: 0 }}>The leaderboard is temporarily unavailable. Please try again in a few minutes.</p></div>;

  const { week, referrers: ref, allTime, totals } = d;
  const c = ref.contest;
  const tabs = [
    { id: 'week', label: `Top Buyers · week ${week.number}` },
    { id: 'ref', label: c ? `Top referrers · ${c.name}` : 'Top referrers' },
    { id: 'all', label: 'All time' },
  ];

  return (
    <div className={styles.wrap}>
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.tabs} role="tablist">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'week' && (
          <>
            <p className={styles.sub}>
              Every week, 10% of all presale purchases goes to a USDT prize pool (up to 500 USDT).
              {week.prorata ? ' The top 3 buyers of the week share it in proportion to what they bought.' : ' The top 3 buyers of the week share it 50/30/20.'}
              {' '}Paid in USDT after the week closes, every transaction published.
            </p>
            <div className={styles.stats}>
              <div><span>Prize pool</span><b>{usd(week.pool)} USDT</b></div>
              <div><span>Bought this week</span><b>{usd(week.volume)} USDT</b></div>
              <div><span>Ends {day(week.end)} · 14:00 UTC</span><b><Countdown end={week.end} /></b></div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Table rows={week.rows} cols={[
                { h: 'Bought', v: (r) => `${usd(r.usd)} USDT` },
                { h: 'Prize', cls: 'amount', v: (r, i) => (i < week.topN ? `${usd(r.prize)} USDT` : '') },
              ]} />
            </div>
          </>
        )}

        {tab === 'ref' && (
          <>
            {c ? (
              <>
                <p className={styles.sub}>
                  Ranked by presale volume brought through your referral link, from {day(Date.parse(c.start) / 1000)} to {day(Date.parse(c.end) / 1000)} at 14:00 UTC.
                  {' '}{c.rules}{' '}
                  <a href={c.rulesUrl} target="_blank" rel="noopener noreferrer" className="text-gradient font-bold">Full rules</a>
                </p>
                <div className={styles.stats}>
                  {c.prizes.map((p, i) => <div key={p}><span>{['1st', '2nd', '3rd'][i]}</span><b>{p}</b></div>)}
                </div>
                {c.ended ? (
                  <p className={styles.sub} style={{ marginTop: 14, marginBottom: 0 }}>Contest closed. Final results are announced in our Telegram group.</p>
                ) : (
                  <p className={styles.sub} style={{ marginTop: 14, marginBottom: 0 }}>Ends in <b style={{ color: '#a3e635' }}><Countdown end={Date.parse(c.end) / 1000} /></b>. Your link also earns 2% in JOOB on every purchase it brings.</p>
                )}
              </>
            ) : (
              <p className={styles.sub}>Ranked by presale volume brought through each referral link since the start of the presale. Your link earns 2% in JOOB on every purchase it brings.</p>
            )}
            <div style={{ marginTop: 14 }}>
              <Table rows={ref.rows} cols={[
                { h: 'Volume brought', cls: 'amount', v: (r) => `${usd(r.usd)} USDT` },
                { h: 'Buyers', v: (r) => r.buyers },
              ]} />
            </div>
            <p className={styles.sub} style={{ marginTop: 14, marginBottom: 0 }}>
              Get your link on the <Link href="/presale" className="text-gradient font-bold">presale page, Referral tab</Link>.
            </p>
          </>
        )}

        {tab === 'all' && (
          <>
            <div className={styles.stats}>
              <div><span>Raised</span><b>{usd(totals.raised)} USDT</b></div>
              <div><span>Buyers</span><b>{totals.buyers}</b></div>
              <div><span>Purchases</span><b>{totals.purchases}</b></div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Table rows={allTime} cols={[
                { h: 'Bought', cls: 'amount', v: (r) => `${usd(r.usd)} USDT` },
                { h: 'Purchases', v: (r) => r.purchases },
              ]} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
