'use client';

// Profil de reputation public d'un wallet : faits on-chain uniquement (aucun avis, aucune note).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../../context/Web3Context';
import { readAllEscrows, summarize, fmtVolume } from '../../../../lib/reputation';
import { dealPath } from '../../../../lib/escrowContract';
import { REPUTATION } from '../../../../config/reputation';
import styles from './reputation.module.css';

const STATUS = { 1: 'Funded', 2: 'Completed', 3: 'In dispute', 4: 'Settled after dispute', 5: 'Cancelled' };
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const fmtDay = (s) => new Date(s * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

function RoleCard({ title, hint, r }) {
  return (
    <div className={styles.role}>
      <h3>{title}</h3>
      <p className={styles.roleHint}>{hint}</p>
      <ul>
        <li><span>Completed deals</span><b>{r.completed}</b></li>
        <li><span>Volume completed</span><b>{fmtVolume(r.volume)} USD</b></li>
        <li><span>Disputes</span><b>{r.disputes}</b></li>
        <li><span>Cancelled</span><b>{r.cancelled}</b></li>
        <li><span>Active now</span><b>{r.active}</b></li>
      </ul>
    </div>
  );
}

export default function ReputationClient({ address }) {
  const { readProvider } = useWeb3();
  const router = useRouter();
  const valid = typeof address === 'string' && ethers.isAddress(address);
  const addr = valid ? ethers.getAddress(address) : null;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lookup, setLookup] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!addr || !readProvider) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null); setError(null);
    readAllEscrows(readProvider)
      .then((all) => { if (!cancelled) setData(summarize(all, addr)); })
      .catch((e) => { console.error('[Reputation]', e); if (!cancelled) setError('We could not read the contracts right now. Please try again in a minute.'); });
    return () => { cancelled = true; };
  }, [addr, readProvider]);

  const go = (e) => {
    e.preventDefault();
    const a = lookup.trim();
    if (ethers.isAddress(a)) router.push(REPUTATION.path(ethers.getAddress(a)));
  };

  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${REPUTATION.path(addr)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>ESCROW REPUTATION</p>

      {!valid ? (
        <h1 className={styles.title}>This is not a valid wallet address.</h1>
      ) : (
        <>
          <h1 className={styles.title}>
            <span className={styles.mono}>{short(addr)}</span>
          </h1>
          <p className={styles.sub}>
            Track record on JoobEscrow, read directly from our smart contracts on BNB Chain. No reviews, no ratings: only on-chain facts. The $1 demo is not counted.
          </p>
          <div className={styles.links}>
            <a href={`https://bscscan.com/address/${addr}`} target="_blank" rel="noopener noreferrer">View wallet on BscScan ↗</a>
            <button type="button" onClick={copy}>{copied ? 'Link copied' : 'Copy profile link'}</button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {!data && !error && <p className={styles.muted}>Reading the contracts…</p>}

          {data && (
            <>
              <div className={styles.summary}>
                <div><b>{data.completed}</b><span>completed deals</span></div>
                <div><b>{fmtVolume(data.volume)}</b><span>USD completed</span></div>
                <div><b>{data.counterparties}</b><span>different counterparties</span></div>
                <div><b>{data.disputes}</b><span>disputes</span></div>
                <div><b>{data.firstAt ? fmtDay(data.firstAt) : 'n/a'}</b><span>first deal</span></div>
              </div>

              {data.list.length === 0 ? (
                <p className={styles.muted}>No escrow on JoobEscrow for this wallet yet.</p>
              ) : (
                <>
                  <div className={styles.roles}>
                    <RoleCard title="As provider" hint="Escrows where this wallet gets paid." r={data.roles.provider} />
                    <RoleCard title="As client" hint="Escrows where this wallet pays." r={data.roles.client} />
                  </div>

                  <h2 className={styles.h2}>Escrows</h2>
                  <ul className={styles.list}>
                    {data.list.map((e) => (
                      <li key={`${e.contract}-${e.id}`}>
                        <span className={styles.role2}>{e.role === 'provider' ? 'Got paid' : 'Paid'}</span>
                        <span>{fmtVolume(BigInt(e.amount))} {e.symbol}</span>
                        <span className={styles.status}>{STATUS[e.status] || `Status ${e.status}`}</span>
                        <span className={styles.muted}>{fmtDay(e.createdAt)}</span>
                        <Link href={dealPath(REPUTATION.dealCategory, String(e.id), e.contract, false)}>Deal #{e.id} ↗</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </>
      )}

      <form onSubmit={go} className={styles.lookup}>
        <input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Check another wallet: 0x…" aria-label="Wallet address" />
        <button type="submit" className="btn btn-primary">Check</button>
      </form>
    </div>
  );
}
