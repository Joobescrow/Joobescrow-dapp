'use client';

// Conversation XMTP chiffree avec la contrepartie d'un escrow, partagee par le chat et l'onglet Files.
// Messages gardes : texte et pieces jointes integrees (Attachment, < 1 Mo).
import { useState, useEffect, useCallback, useRef } from 'react';
import { IdentifierKind, isAttachment } from '@xmtp/browser-sdk';
import { useWeb3 } from '../context/Web3Context';
import { useXMTP } from '../context/XMTPContext';

const NOT_ACTIVATED = "This wallet hasn't activated XMTP yet. Ask them to open the chat once to enable messaging.";

export const isFileMessage = (m) => {
  try { return isAttachment(m); } catch { return false; }
};
const keep = (m) => typeof m.content === 'string' || isFileMessage(m);

export function useXmtpDm(peerAddress) {
  const { signer } = useWeb3();
  const { client, initialize, isInitializing } = useXMTP();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const convRef = useRef(null);
  const peerInboxRef = useRef(null);

  // Rechargement : synchro de toutes les conversations (pas seulement la notre). Si chaque partie a
  // cree son propre DM (cas d'un pair qui ecrit avant que l'on ait ouvert le chat), XMTP ne fusionne
  // les deux qu'une fois les deux synchronises en local ; sinon les messages du pair restent invisibles.
  const reload = useCallback(async () => {
    if (!convRef.current || !client) return;
    try {
      await client.conversations.syncAll();
      const merged = peerInboxRef.current ? await client.conversations.getDmByInboxId(peerInboxRef.current) : null;
      if (merged && merged.id !== convRef.current.id) {
        convRef.current = merged;
        setConversation(merged);
      }
      setMessages((await convRef.current.messages()).filter(keep));
    } catch (e) {
      console.error('[XMTP] Failed to refresh messages:', e);
    }
  }, [client]);

  useEffect(() => {
    if (!client || !peerAddress) return;
    let isMounted = true;
    let stream = null;
    let poll = null;

    (async () => {
      try {
        const peerIdentifier = { identifier: peerAddress.toLowerCase(), identifierKind: IdentifierKind.Ethereum };
        const canMsgMap = await client.canMessage([peerIdentifier]);
        if (!canMsgMap.get(peerIdentifier.identifier)) { if (isMounted) setError(NOT_ACTIVATED); return; }
        const peerInboxId = await client.fetchInboxIdByIdentifier(peerIdentifier);
        if (!peerInboxId) { if (isMounted) setError(NOT_ACTIVATED); return; }
        peerInboxRef.current = peerInboxId;

        try { await client.conversations.syncAll(); } catch (e) { console.error('[XMTP] Failed to sync conversations:', e); }
        let conv;
        try {
          conv = await client.conversations.getDmByInboxId(peerInboxId);
        } catch {
          conv = (await client.conversations.list()).find((c) => c.peerInboxId === peerInboxId);
        }
        if (!conv) conv = await client.conversations.createDm(peerInboxId);
        if (!isMounted) return;
        convRef.current = conv;
        setConversation(conv);
        setMessages((await conv.messages()).filter(keep));

        // Si les deux parties ont chacune cree leur DM, XMTP les fusionne a la lecture mais le stream
        // d'un seul DM ne voit pas les messages de l'autre : on ecoute tout le client et on recharge
        // quand le pair ecrit, avec un rechargement periodique en filet de securite.
        poll = setInterval(reload, 10000);
        try {
          stream = await client.conversations.streamAllMessages();
          for await (const msg of stream) {
            if (!isMounted) break;
            if (msg && msg.senderInboxId === peerInboxId) await reload();
          }
        } catch (e) {
          console.error('Stream error:', e);
        }
      } catch (err) {
        console.error('Error loading V3 chat:', err);
        if (isMounted) setError('Error setting up conversation: ' + err.message);
      }
    })();

    return () => {
      isMounted = false;
      if (poll) clearInterval(poll);
      if (stream && typeof stream.return === 'function') { try { stream.return(); } catch {} }
    };
  }, [client, peerAddress, reload]);

  const activate = async () => {
    if (!signer) { setError('Connect your wallet first'); return; }
    setError(null);
    try {
      await initialize(signer);
    } catch (err) {
      console.error('Failed to initialize XMTP V3:', err);
      const detail = String(err?.message || err || '').slice(0, 160);
      setError(/reject|denied|cancel/i.test(detail) ? 'Signature rejected. You must sign to use chat.' : `Chat could not start: ${detail || 'unknown error'}`);
    }
  };

  /** Envoi avec garde-fou : le worker XMTP peut rester bloque si le pair n'est pas joignable. */
  const withTimeout = (promise) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Send failed: the recipient may not have activated XMTP chat yet, or the network is unavailable. Please try again.')), 30000)),
  ]);

  const sendText = async (text) => {
    if (!conversation) throw new Error('Conversation is not fully loaded. Please wait or reload.');
    await conversation.sync();
    // V7 : sendText() pour du texte ; send() attend un EncodedContent et bloque le worker avec une chaine.
    await withTimeout(conversation.sendText(text));
    await reload();
  };

  const sendFile = async (attachment) => {
    if (!conversation) throw new Error('Conversation is not fully loaded. Please wait or reload.');
    await conversation.sync();
    await withTimeout(conversation.sendAttachment(attachment));
    await reload();
  };

  return { client, conversation, messages, error, setError, activate, isInitializing, sendText, sendFile, reload };
}
