'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { usePresaleState } from '../hooks/usePresaleState';
import { PRESALE_ADDRESSES, PRESALE_ABI, PRESALE_CHAIN_ID, readableError } from '../config/presale';
import styles from './PresaleGlassCard.module.css';

function CountdownDisplay({ seconds }) {
  const s = seconds > 0n ? Number(seconds) : 0;
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  return (
    <div className={styles.timerMono}>
      <span>{String(days).padStart(2, '0')}d</span>{' '}
      <span>{String(hours).padStart(2, '0')}h</span>{' '}
      <span>{String(minutes).padStart(2, '0')}m</span>{' '}
      <span>{String(secs).padStart(2, '0')}s</span>
    </div>
  );
}

const BADGE = {
  // Etat neutre pendant la lecture on-chain : jamais de date perimee affichee au chargement.
  LOADING: 'PRESALE',
  PENDING: 'OPENING SOON',
  AWAITING_START: 'OPENING SHORTLY',
  LIVE: 'LIVE',
  PAUSED: 'PAUSED',
  SOLD_OUT: 'SOLD OUT',
  FINALIZATION_PENDING: 'SALE ENDED',
  ENDED: 'SALE ENDED',
};

export default function PresaleGlassCard() {
  const { readProvider, account, provider, connectWallet } = useWeb3();
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeMsg, setFinalizeMsg] = useState(null);
  const {
    config,
    global,
    computedState,
    countdownSeconds,
    currentPrice,
    nextPrice,
    nextStepSeconds,
    finalPrice,
  } = usePresaleState(readProvider);

  const isLive = computedState === 'LIVE';
  const isPending = computedState === 'PENDING';
  const isClosed = computedState === 'ENDED' || computedState === 'FINALIZATION_PENDING';
  const isSoldOut = computedState === 'SOLD_OUT';

  // finalize() est sans permission une fois endTime passe : n'importe quel wallet peut ouvrir les claims.
  const finalize = async () => {
    if (!account || !provider) { await connectWallet(); return; }
    setFinalizing(true); setFinalizeMsg(null);
    try {
      const { chainId } = await provider.getNetwork();
      if (Number(chainId) !== PRESALE_CHAIN_ID) { setFinalizeMsg('Switch your wallet to BNB Smart Chain, then try again.'); return; }
      const signer = new ethers.JsonRpcSigner(provider, account);
      const presale = new ethers.Contract(PRESALE_ADDRESSES.PRESALE, PRESALE_ABI, signer);
      await (await presale.finalize()).wait();
      setFinalizeMsg('Sale finalized: claims are open.');
    } catch (err) {
      setFinalizeMsg(readableError(err));
    } finally {
      setFinalizing(false);
    }
  };

  // Pendant la lecture on-chain : « … » (jamais d'ancien prix affiche puis remplace).
  const priceUSD = config && currentPrice
    ? Number(ethers.formatUnits(currentPrice, config.paymentDecimals)).toFixed(4)
    : null;

  const nextPriceUSD = config && nextPrice
    ? Number(ethers.formatUnits(nextPrice, config.paymentDecimals)).toFixed(4)
    : null;

  const raisedUSD = config && global?.totalRaised !== undefined
    ? Math.round(Number(ethers.formatUnits(global.totalRaised, config.paymentDecimals))).toLocaleString('en-US')
    : null;

  const finalPriceUSD = config && finalPrice
    ? Number(ethers.formatUnits(finalPrice, config.paymentDecimals)).toFixed(4)
    : '0.0000';



  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <img src="/logo.svg" alt="" width={24} height={24} />
          <span>JOOB · Presale</span>
        </div>
        <span className={`${styles.badge} ${isLive ? styles.badgeLive : styles.badgePending}`}>
          {BADGE[computedState] ?? 'PRESALE'}
        </span>
      </div>

      {isPending && (
        <div className={styles.countdownBox}>
          <div className={styles.boxLabel}>Presale Opens In</div>
          <CountdownDisplay seconds={countdownSeconds} />
        </div>
      )}

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>{isClosed ? 'Final Price' : isSoldOut ? 'Price' : 'Current Price'}</div>
          <div className={styles.metricVal}>{isSoldOut ? 'Sold out' : isClosed ? `$${finalPriceUSD}` : priceUSD ? `$${priceUSD}` : '…'}</div>
          <div className={styles.metricSub}>{isClosed ? 'Sale closed' : isSoldOut ? 'Cap reached' : nextPriceUSD ? `Next: $${nextPriceUSD}` : '\u00a0'}</div>
        </div>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Raised</div>
          <div className={styles.metricVal}>{raisedUSD === null ? '…' : `$${raisedUSD}`}</div>
          <div className={styles.metricSub}>Cap 163.5M JOOB</div>
        </div>
      </div>

      {isLive && nextStepSeconds > 0n && (
        <div className={styles.stepBox}>
          <div className={styles.stepHeader}>
            <span>Next price step in:</span>
            <CountdownDisplay seconds={nextStepSeconds} />
          </div>
        </div>
      )}

      {/* Le hero porte deja « Join the Presale » : la carte n'a un bouton qu'en fin de vente (finalisation, claim). */}
      {(computedState === 'FINALIZATION_PENDING' || computedState === 'ENDED') && (
      <div className={styles.actionWrap}>
        {computedState === 'FINALIZATION_PENDING' ? (
          <>
            <button type="button" onClick={finalize} disabled={finalizing} className="btn btn-primary" style={{ width: '100%', padding: '13px 0', fontSize: '1rem' }}>
              {finalizing ? 'Finalizing…' : 'Finalize the sale (open to anyone)'}
            </button>
            <div className={styles.metricSub} style={{ marginTop: '8px', textAlign: 'center' }} role="status">
              {finalizeMsg ?? 'The sale ended. Any wallet can call finalize() on-chain to open claims.'}
            </div>
          </>
        ) : (
          <Link href="/presale#claim" className="btn btn-primary" style={{ width: '100%', padding: '13px 0', fontSize: '1rem' }}>
            Claim your JOOB →
          </Link>
        )}
      </div>
      )}

    </div>
  );
}
