'use client';

// Onglet « Files » d'un escrow : fichiers echanges dans le chat chiffre (XMTP) et, en litige,
// enregistrement de leur empreinte on-chain (submitEvidence, contrat V4 inchange) + verification d'un fichier.
import { useEffect, useRef, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useToast } from '../context/ToastContext';
import { useXmtpDm, isFileMessage } from '../hooks/useXmtpDm';
import { useRecordEvidence } from '../hooks/useRecordEvidence';
import { prepareAttachment, sha256Bytes32 } from '../lib/evidence';
import { CHAT_FILES } from '../config/chatFiles';
import FileAttachment from './FileAttachment';
import { EvidenceList, VerifyFile, useEvidence } from './EvidencePanel';
import './EscrowFiles.css';

export default function EscrowFiles({ escrow, escrowAddr, peerAddress }) {
  const { account } = useWeb3();
  const { showToast } = useToast();
  const { client, conversation, messages, error, setError, activate, isInitializing, sendFile } = useXmtpDm(peerAddress);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(null);
  const [recordOnSend, setRecordOnSend] = useState(true);
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

  const recorded = (h) => evidence.some((it) => it.hash.toLowerCase() === h?.toLowerCase());

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy('send');
    try {
      const att = await prepareAttachment(f);
      await sendFile(att);
      showToast('success', `${att.filename} sent in the encrypted chat.`);
      if (isDisputed && recordOnSend) {
        setBusy(null);
        await record(await sha256Bytes32(att.content), att.filename);
      }
    } catch (err) {
      console.error('[Files] send:', err);
      setError(err.message);
    }
    setBusy(null);
  };

  return (
    <div className="ef">
      {!client ? (
        <div className="ef-activate">
          <p>Files are exchanged through the end-to-end encrypted chat. Activate it once with a signature.</p>
          <button type="button" className="btn btn-primary" onClick={activate} disabled={isInitializing}>
            {isInitializing ? 'Connecting…' : 'Activate encrypted chat'}
          </button>
        </div>
      ) : (
        <>
          <div className="ef-send">
            <input ref={fileRef} type="file" accept={CHAT_FILES.accept} hidden onChange={onPick} />
            <button type="button" className="btn btn-app-primary" onClick={() => fileRef.current?.click()} disabled={!conversation || busy === 'send'}>
              {busy === 'send' ? 'Sending…' : 'Send a file'}
            </button>
            <span className="ef-muted">PDF, images, text, CSV, JSON or ZIP, max {CHAT_FILES.maxLabel} per file. Large images are compressed automatically.</span>
            {isDisputed && (
              <label className="ef-check">
                <input type="checkbox" checked={recordOnSend} onChange={(e) => setRecordOnSend(e.target.checked)} />
                <span>Also record it as dispute evidence on-chain (one transaction, a few cents of BNB)</span>
              </label>
            )}
          </div>
          {error && <p className="ef-warn" role="alert">{error}</p>}

          <h4 className="ef-title">Files exchanged with this counterparty</h4>
          {files.length === 0 ? (
            <p className="ef-muted">No file yet.</p>
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
                      <button type="button" className="btn btn-app-secondary ef-rec" onClick={() => record(h, m.content.filename || 'File')} disabled={Boolean(busy) || Boolean(recording)}>
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

      <p className="ef-note">
        Only the fingerprint of a file goes on-chain, never its content. Keep your original files: messages are stored on the XMTP network for a limited time.
      </p>
    </div>
  );
}
