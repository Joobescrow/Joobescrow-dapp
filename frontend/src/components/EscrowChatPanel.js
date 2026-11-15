'use client';

// Onglet « Chat & files » d'un escrow : une seule conversation XMTP (une activation, une synchro)
// partagee par le chat et la liste des fichiers / preuves de litige.
import { useXmtpDm } from '../hooks/useXmtpDm';
import ChatBox from './ChatBox';
import EscrowFiles from './EscrowFiles';

export default function EscrowChatPanel({ escrow, escrowAddr, peerAddress, isDisputed }) {
  const dm = useXmtpDm(peerAddress);
  return (
    <div className="escrow-chat-panel">
      <ChatBox dm={dm} evidence={{ escrowAddr, escrowId: escrow.id, isDisputed }} />
      <EscrowFiles dm={dm} escrow={escrow} escrowAddr={escrowAddr} />
    </div>
  );
}
