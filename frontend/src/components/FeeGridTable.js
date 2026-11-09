'use client';

// Tableau public de la grille de frais : tranches tirees de config/feeTiers.js,
// taux relus on-chain (defaultFeeBPS) sur le contrat de chaque palier.
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { ESCROW_ABI } from '../config/contract';
import { FEE_TIERS, FEE_PUBLIC_LINE, tierAmountLabel } from '../config/feeTiers';

const short = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export default function FeeGridTable() {
  const { readProvider } = useWeb3();
  const [bps, setBps] = useState({});

  useEffect(() => {
    if (!readProvider) return;
    let cancelled = false;
    Promise.all(FEE_TIERS.map(async (t) => {
      try {
        return [t.contract, Number(await new ethers.Contract(t.contract, ESCROW_ABI, readProvider).defaultFeeBPS())];
      } catch {
        return [t.contract, null];
      }
    })).then((entries) => { if (!cancelled) setBps(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [readProvider]);

  const cell = { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' };

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 14px' }}>{FEE_PUBLIC_LINE}</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '420px' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)' }}>
              <th style={cell}>Deal amount (USDT or USDC)</th>
              <th style={cell}>Provider fee, read on-chain</th>
              <th style={cell}>Contract</th>
            </tr>
          </thead>
          <tbody>
            {FEE_TIERS.map((t) => {
              const live = bps[t.contract];
              return (
                <tr key={t.contract}>
                  <td style={{ ...cell, color: '#fff' }}>{tierAmountLabel(t)}</td>
                  <td style={{ ...cell, color: '#a3e635', fontWeight: 700 }} className="tabular-nums">
                    {live == null ? '...' : `${live / 100}%`}
                  </td>
                  <td style={cell}>
                    <a href={`https://bscscan.com/address/${t.contract}`} target="_blank" rel="noopener noreferrer" style={{ color: '#d9f99d', fontFamily: 'monospace' }}>
                      {short(t.contract)} ↗
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '12px 0 0' }}>
        The client pays no fee. The fee of each escrow is recorded on-chain when it is created and never changes afterwards.
      </p>
    </div>
  );
}
