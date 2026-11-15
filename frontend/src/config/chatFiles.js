// Fichiers dans le chat chiffre (XMTP) et preuves de litige on-chain (decision du 15/11/2026).
// XMTP : piece jointe integree au message, environ 1 Mo maximum par message (docs.xmtp.org) ;
// conservation sur le reseau visee a environ 6 mois, non garantie : chaque partie garde ses originaux.
export const CHAT_FILES = {
  // Marge sous la limite XMTP de 1 Mo pour l'enveloppe du message.
  maxBytes: 950_000,
  maxLabel: '1 MB',
  // Images compressees avant envoi : plus grand cote et qualite WebP/JPEG.
  imageMaxDim: 1600,
  imageQuality: 0.8,
  // En dessous de ce poids, une image est envoyee telle quelle.
  imageCompressAbove: 300_000,
  accept: '.pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.csv,.json,.zip',
  // Seuls ces types sont affiches en apercu ; tout le reste est propose en telechargement uniquement.
  previewMime: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
};

// Lecture des evenements de preuve : fenetre maximale par eth_getLogs sur le RPC public.
export const EVIDENCE_LOG_WINDOW = 49_000;
export const EVIDENCE_RPCS = ['https://bsc-rpc.publicnode.com', 'https://bsc-dataseed.bnbchain.org'];
