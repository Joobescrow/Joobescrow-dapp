'use client';

// Preuves de litige on-chain (lecture seule) et verification locale d'un fichier.
// Sans dependance XMTP : utilisable sur la page publique /deal comme dans l'onglet Files.
import { useEffect, useRef, useState } from 'react';
import { readEvidence, sha256Bytes32, shortHash } from '../lib/evidence';
import './EscrowFiles.css';

const BSCSCAN = 'https://bscscan.com';
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function EvidenceList({ items, account, loading, error }) {
  if (loading) return <p className="ef-muted">Reading on-chain evidence…</p>;
  if (error) return <p className="ef-muted">{error}</p>;
  if (!items.length) return <p className="ef-muted">No evidence recorded on-chain yet.</p>;
  return (
    <ul className="ef-evidence">
      {items.map((it) => (
        <li key={`${it.txHash}-${it.hash}`}>
          <span className="ef-ev-who">{account && it.party.toLowerCase() === account.toLowerCase() ? 'You' : short(it.party)}</span>
          <span className="ef-ev-hash" title={it.hash}>{shortHash(it.hash)}</span>
          <span className="ef-ev-date">{new Date(it.time * 1000).toLocaleString()}</span>
          <a href={`${BSCSCAN}/tx/${it.txHash}`} target="_blank" rel="noopener noreferrer">On-chain record ↗</a>
        </li>
      ))}
    </ul>
  );
}

/** Verifie qu'un fichier correspond a une empreinte enregistree (calcul local, rien n'est envoye). */
export function VerifyFile({ items }) {
  const ref = useRef(null);
  const [result, setResult] = useState(null);
  const onPick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const h = await sha256Bytes32(await f.arrayBuffer());
    const hit = items.find((it) => it.hash.toLowerCase() === h.toLowerCase());
    setResult(hit
      ? { ok: true, text: `Match: this exact file was recorded on-chain on ${new Date(hit.time * 1000).toLocaleString()}.` }
      : { ok: false, text: `No match: this file (fingerprint ${shortHash(h)}) is not among the recorded evidence.` });
  };
  return (
    <div className="ef-verify">
      <input ref={ref} type="file" hidden onChange={onPick} />
      <button type="button" className="btn btn-app-secondary" onClick={() => ref.current?.click()}>Verify a file</button>
      <span className="ef-muted">The fingerprint is computed in your browser. The file is not uploaded.</span>
      {result && <p className={result.ok ? 'ef-ok' : 'ef-warn'}>{result.text}</p>}
    </div>
  );
}

/** Hook : preuves on-chain d'un escrow (vide tant qu'aucun litige n'a ete ouvert). */
export function useEvidence(contract, escrowId, disputeOpenedAt) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!contract || !Number(disputeOpenedAt)) return undefined;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(null);
    readEvidence(contract, escrowId, disputeOpenedAt)
      .then((r) => { if (!cancelled) setItems(r); })
      .catch((e) => { console.error('[Evidence] read:', e); if (!cancelled) setError('Could not read on-chain evidence right now. Please try again later.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [contract, escrowId, disputeOpenedAt, tick]);
  return { items, loading, error, refresh: () => setTick((t) => t + 1) };
}

/** Bloc complet en lecture seule (page /deal). */
export default function EvidencePanel({ contract, escrowId, disputeOpenedAt }) {
  const { items, loading, error } = useEvidence(contract, escrowId, disputeOpenedAt);
  if (!Number(disputeOpenedAt)) return null;
  return (
    <div className="ef">
      <h4 className="ef-title">Dispute evidence on-chain</h4>
      <EvidenceList items={items} loading={loading} error={error} />
      <VerifyFile items={items} />
      <p className="ef-note">Only file fingerprints are recorded on-chain, never their content. The files themselves stay with the parties and the mediator.</p>
    </div>
  );
}
