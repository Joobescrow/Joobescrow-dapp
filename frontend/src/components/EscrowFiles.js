'use client';

// Fichiers d'un escrow, affiches sous le chat (onglet « Chat & files ») : fichiers echanges dans le chat
// chiffre (XMTP) et, en litige, enregistrement de leur empreinte on-chain (submitEvidence, contrat V4
// inchange) + verification d'un fichier. L'envoi se fait par le trombone du chat.
import { useEffect, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { isFileMessage } from '../hooks/useXmtpDm';
import { useRecordEvidence } from '../hooks/useRecordEvidence';
import { sha256Bytes32 } from '../lib/evidence';
import FileAttachment from './FileAttachment';
import { EvidenceList, VerifyFile, useEvidence } from './EvidencePanel';
import './EscrowFiles.css';

export default function EscrowFiles({ dm, escrow, escrowAddr }) {
  const { account } = useWeb3();
  const { client, messages } = dm;
  const [hashes, setHashes] = useState({});
  const { items: evidence, loading: evLoading, error: evError, refresh: loadEvidence } = useEvidence(escrowAddr, escrow.id, escrow.disputeOpenedAt);
  const { record, recording } = useRecordEvidence(escrowAddr, escrow.id, loadEvidence);

  const isDisputed = escrow.status === 'DISPUTED';
  const hadDispute = Number(escrow.disputeOpenedAt) > 0;
  const files = messages.filter(isFileMessage);

  // Empreintes des fichiers du chat (calcul local).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = {};
      for (const m of files) next[m.id] = await sha256Bytes32(m.content.content);
      if (!cancelled) setHashes(next);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  if (!client && !hadDispute) return null;

  const recorded = (h) => evidence.some((it) => it.hash.toLowerCase() === h?.toLowerCase());

  return (
    <div className="ef">
      {client && (
        <>
          <h4 className="ef-title">Files in this conversation</h4>
          {files.length === 0 ? (
            <p className="ef-muted">No file yet. Use the paperclip in the chat to send one.</p>
          ) : (
            <ul className="ef-files">
              {[...files].reverse().map((m) => {
                const mine = m.senderInboxId === client.inboxId;
                const h = hashes[m.id];
                return (
                  <li key={m.id}>
                    <div className="ef-file-meta">
                      <span>{mine ? 'You' : 'Counterparty'}</span>
                      <span>{new Date(Number(m.sentAtNs / 1000000n)).toLocaleString()}</span>
                    </div>
                    <FileAttachment attachment={m.content} compact />
                    {h && recorded(h) && <span className="ef-ok">Recorded on-chain</span>}
                    {h && isDisputed && !recorded(h) && (
                      <button type="button" className="btn btn-app-secondary ef-rec" onClick={() => record(h, m.content.filename || 'File')} disabled={Boolean(recording)}>
                        {recording === h ? 'Recording…' : 'Record as evidence'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {hadDispute && (
        <>
          <h4 className="ef-title">Dispute evidence on-chain</h4>
          <EvidenceList items={evidence} account={account} loading={evLoading} error={evError} />
          <VerifyFile items={evidence} />
        </>
      )}

      {client && (
        <p className="ef-note">
          Only the fingerprint of a file goes on-chain, never its content. Keep your original files: messages are stored on the XMTP network for a limited time.
        </p>
      )}
    </div>
  );
}
