'use client';

// Bouton « Download receipt (PDF) » : recu genere dans le navigateur a partir de la chaine (lib/receipt.js).
import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { dealPath } from '../lib/escrowContract';
import { RECEIPT } from '../config/receipt';

export default function ReceiptButton({ contract, escrowId, niche, className }) {
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
      {state === 'busy' ? 'Preparing receipt…' : state === 'error' ? 'Receipt failed, try again' : RECEIPT.buttonLabel}
    </button>
  );
}
