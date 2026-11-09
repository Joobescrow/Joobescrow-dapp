'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { ESCROW_ABI } from '../config/contract';
import { FEE_TIERS, FEE_MIN_USD, FEE_MAX_USD, FEE_RANGE_MESSAGE, tierForAmount, tierAmountLabel } from '../config/feeTiers';

// Grille par montant (config/feeTiers.js) : le palier depend du montant saisi,
// les taux sont lus on-chain (defaultFeeBPS) sur le contrat de chaque palier, jamais codes en dur.
export default function FeeCalculator() {
  const { readProvider } = useWeb3();
  const [amount, setAmount] = useState(1000);
  const [bpsByContract, setBpsByContract] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchFees() {
      if (!readProvider) return;
      try {
        const read = await Promise.all(FEE_TIERS.map(async (t) => [
          t.contract,
          Number(await new ethers.Contract(t.contract, ESCROW_ABI, readProvider).defaultFeeBPS()),
        ]));
        if (isMounted) {
          setBpsByContract(Object.fromEntries(read));
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching fee BPS:", err);
        if (isMounted) setLoading(false);
      }
    }
    fetchFees();
    return () => { isMounted = false; };
  }, [readProvider]);

  const handleAmountChange = (e) => {
    const val = Number(e.target.value);
    setAmount(val >= 0 ? val : 0);
  };

  const tier = tierForAmount(amount);
  const feeBPS = tier ? (bpsByContract[tier.contract] ?? null) : null;
  const percentage = feeBPS == null ? 0 : feeBPS / 100;
  const feeAmount = tier ? (amount * percentage) / 100 : 0;
  const providerReceives = tier ? amount - feeAmount : 0;

  return (
    <div className="glass-panel" style={{ padding: '24px', margin: '0', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: '1 1 260px', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#fff', margin: '0 0 8px 0' }}>Transparent Fees</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Calculate exactly what you pay and what they get.</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Escrow Amount (USDT or USDC)</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '1.2rem' }}>$</span>
          <input
            type="number"
            min={FEE_MIN_USD}
            max={FEE_MAX_USD}
            style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 12px 12px 35px', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }}
            value={amount}
            onChange={handleAmountChange}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Fee grid (set by the amount)</span>
        <div aria-label="Fee grid" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {loading ? (
            <span style={{ height: '52px', width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px' }} />
          ) : FEE_TIERS.map((t) => {
            const active = tier && t.contract === tier.contract;
            const live = bpsByContract[t.contract];
            return (
              <div
                key={t.contract}
                aria-current={active ? 'true' : undefined}
                style={{ flex: '1 1 0', minWidth: '84px', padding: '8px 6px', borderRadius: '8px', textAlign: 'center', fontFamily: 'inherit', color: active ? '#0d1117' : '#fff', background: active ? '#10b981' : 'rgba(0,0,0,0.4)', border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{live == null ? '...' : `${live / 100}%`}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{tierAmountLabel(t)}</div>
              </div>
            );
          })}
        </div>
        {!tier && (
          <p style={{ color: '#EAB308', fontSize: '0.8rem', margin: '10px 0 0' }}>{FEE_RANGE_MESSAGE}</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Client deposits:</span>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{amount.toFixed(2)} USDT</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', backgroundColor: 'rgba(190,242,100,0.08)', border: '1px solid rgba(190,242,100,0.28)', borderRadius: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            JoobEscrow Fee
            {loading ? <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', height: '16px', width: '30px', borderRadius: '4px' }}></span> : <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>{percentage}%</span>}
          </span>
          <span style={{ color: '#d9f99d', fontWeight: 'bold' }}>-{feeAmount.toFixed(2)} USDT</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 15px', backgroundColor: 'rgba(50,255,100,0.1)', border: '1px solid rgba(50,255,100,0.2)', borderRadius: '8px' }}>
          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Provider receives:</span>
          <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem' }}>{providerReceives.toFixed(2)} USDT</span>
        </div>
      </div>

      <div style={{ marginTop: '14px', padding: '10px 15px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
        On this deal, a marketplace keeping 20% to 30% would take <strong style={{ color: '#fff' }}>{(amount * 0.2).toFixed(0)} to {(amount * 0.3).toFixed(0)} USDT</strong>.
        JoobEscrow: <strong style={{ color: '#4ade80' }}>{feeAmount.toFixed(0)} USDT</strong>, client pays 0%.
      </div>

      <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px', marginBottom: '12px' }}>
        The fee is only deducted from the provider&apos;s payout on completion. If the escrow is cancelled before the provider accepts, the client gets a full refund (minus network gas).
      </p>

      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Want to test the full flow first?{' '}
        <Link href="/try" style={{ color: '#a3e635', fontWeight: 700, textDecoration: 'none' }}>
          Try it with $1 →
        </Link>
      </div>
    </div>
  );
}
