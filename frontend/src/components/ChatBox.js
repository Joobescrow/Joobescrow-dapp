'use client';

import { useState, useEffect, useRef } from 'react';
import { isFileMessage } from '../hooks/useXmtpDm';
import { useRecordEvidence } from '../hooks/useRecordEvidence';
import { prepareAttachment, sha256Bytes32 } from '../lib/evidence';
import { CHAT_FILES } from '../config/chatFiles';
import FileAttachment from './FileAttachment';
import './ChatBox.css';

// dm : resultat de useXmtpDm (partage avec la liste des fichiers, voir EscrowChatPanel).
// evidence (facultatif) : { escrowAddr, escrowId, isDisputed } pour proposer l'enregistrement on-chain
// d'un fichier envoye pendant un litige.
export default function ChatBox({ dm, evidence = null }) {
  const { client, conversation, messages, error, setError, activate, isInitializing, sendText, sendFile } = dm;
  const { record, recording } = useRecordEvidence(evidence?.escrowAddr, evidence?.escrowId);
  const [recordOnSend, setRecordOnSend] = useState(true);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);
  const lastCountRef = useRef(0);
  const fileRef = useRef(null);

  // Defilement interne a la liste seulement (jamais la page), et seulement quand un message arrive :
  // le rechargement periodique (10 s) ne doit pas faire bouger la fenetre.
  useEffect(() => {
    const el = listRef.current;
    if (!el || messages.length === lastCountRef.current) return;
    lastCountRef.current = messages.length;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !client) return;
    setIsSending(true);
    try {
      await sendText(text.trim());
      setText('');
    } catch (err) {
      console.error('[XMTP] Failed to send message:', err);
      setError('Failed to send message: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsSending(true);
    try {
      const att = await prepareAttachment(file);
      await sendFile(att);
      if (evidence?.isDisputed && recordOnSend) {
        setIsSending(false);
        await record(await sha256Bytes32(att.content), att.filename);
      }
    } catch (err) {
      console.error('[XMTP] Failed to send file:', err);
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!client) {
    return (
      <div className="chatbox-container">
        <div className="chatbox-uninitialized">
          <h4>Encrypted chat &amp; files</h4>
          <p>Talk and share files with your counterparty, end-to-end encrypted. Activate it once with a free signature.</p>
          <button type="button" className="btn btn-app-primary" onClick={activate} disabled={isInitializing}>
            {isInitializing ? 'Connecting…' : 'Activate encrypted chat'}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  const blocked = Boolean(error) && !conversation;

  return (
    <div className="chatbox-container">
      <div className="chatbox-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          Encrypted Chat
        </h4>
        <span className="text-xs text-green-400" style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          End-to-End Encrypted (XMTP Network)
        </span>
      </div>

      {error && (
        <div className="p-2 bg-red-900/50 text-red-200 text-sm border-b border-red-800" role="alert">
          {error}
          {conversation && <button type="button" className="chat-error-dismiss" onClick={() => setError(null)} aria-label="Dismiss">×</button>}
        </div>
      )}

      <div className="chatbox-messages" ref={listRef}>
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet. Send a message to start!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderInboxId === client.inboxId;
            const date = new Date(Number(msg.sentAtNs / 1000000n));
            return (
              <div key={msg.id} className={`chat-bubble-wrapper ${isMe ? 'is-me' : 'is-peer'}`}>
                <div className="chat-bubble">
                  {isFileMessage(msg) ? <FileAttachment attachment={msg.content} /> : msg.content}
                </div>
                <div className="chat-time">
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="chatbox-input-area" onSubmit={handleSend}>
        <input ref={fileRef} type="file" accept={CHAT_FILES.accept} onChange={handleFile} hidden />
        <button
          type="button"
          className="chat-attach-btn"
          onClick={() => fileRef.current?.click()}
          disabled={isSending || blocked}
          title={`Attach a file (max ${CHAT_FILES.maxLabel})`}
          aria-label={`Attach a file (max ${CHAT_FILES.maxLabel})`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message or paste a link..."
          disabled={isSending || blocked}
        />
        <button type="submit" disabled={isSending || !text.trim() || blocked}>
          {isSending ? '...' : 'Send'}
        </button>
      </form>
      <div className="chat-files-hint">
        <span>Files: max {CHAT_FILES.maxLabel} each. Large images are compressed automatically.</span>
        {evidence?.isDisputed && (
          <label className="ef-check">
            <input type="checkbox" checked={recordOnSend} onChange={(e) => setRecordOnSend(e.target.checked)} />
            <span>Also record files as dispute evidence on-chain (one wallet confirmation per file)</span>
          </label>
        )}
        {recording && <span className="ef-ok">Confirm the evidence transaction in your wallet…</span>}
      </div>
    </div>
  );
}
