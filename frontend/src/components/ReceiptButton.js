'use client';

// Bouton « Download receipt (PDF) » : recu genere dans le navigateur a partir de la chaine (lib/receipt.js).
import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { dealPath } from '../lib/escrowContract';
import { RECEIPT } from '../config/receipt';

export default function ReceiptButton({ contract, escrowId, niche, className, label = RECEIPT.buttonLabel, icon = false }) {
  const { readProvider } = useWeb3();
  const [state, setState] = useState('idle'); // idle | busy | error

  const onClick = async () => {
    if (!readProvider || !contract || state === 'busy') return;
    setState('busy');
    try {
      const { downloadReceipt } = await import('../lib/receipt');
      await downloadReceipt({
        provider: readProvider,
        contract,
        escrowId: String(escrowId),
        niche,
        origin: window.location.origin,
        dealPath: dealPath(niche.slug, String(escrowId), contract, niche.isDemo),
      });
      setState('idle');
    } catch (err) {
      console.error('[Receipt]', err);
      setState('error');
    }
  };

  return (
    <button type="button" className={className} onClick={onClick} disabled={state === 'busy' || !readProvider}>
      {icon && state === 'idle' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 6 }}><path d="M12 3v12" /><polyline points="7 10 12 15 17 10" /><path d="M5 21h14" /></svg>
      )}
      {state === 'busy' ? 'Preparing receipt…' : state === 'error' ? 'Receipt failed, try again' : label}
    </button>
  );
}
