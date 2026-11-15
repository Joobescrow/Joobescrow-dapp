// Preuves de litige : empreinte SHA-256 d'un fichier, enregistree on-chain par submitEvidence (contrat V4,
// sans modification). Le fichier lui-meme n'est jamais publie : il reste chez les parties et dans le chat chiffre.
import { ethers } from 'ethers';
import { CHAT_FILES, EVIDENCE_LOG_WINDOW, EVIDENCE_RPCS } from '../config/chatFiles';

const IFACE = new ethers.Interface([
  'event DisputeOpened(uint256 indexed escrowId, address indexed opener, bytes32 evidenceHash)',
  'event EvidenceSubmitted(uint256 indexed escrowId, address indexed party, bytes32 evidenceHash)',
]);
const TOPIC_DISPUTE = IFACE.getEvent('DisputeOpened').topicHash;
const TOPIC_EVIDENCE = IFACE.getEvent('EvidenceSubmitted').topicHash;

/** Empreinte SHA-256 d'un contenu (Uint8Array ou ArrayBuffer), au format bytes32 0x… */
export async function sha256Bytes32(data) {
  const buf = data instanceof ArrayBuffer ? data : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return ethers.hexlify(new Uint8Array(digest));
}

export const shortHash = (h) => `${h.slice(0, 10)}…${h.slice(-6)}`;

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Prepare un fichier pour le chat : compresse les images lourdes (canvas, WebP puis JPEG),
 * puis verifie la taille. Renvoie { filename, mimeType, content } ou leve une erreur lisible.
 */
export async function prepareAttachment(file) {
  let content = new Uint8Array(await file.arrayBuffer());
  let mimeType = file.type || 'application/octet-stream';
  let filename = file.name || 'file';

  const isRaster = ['image/png', 'image/jpeg', 'image/webp'].includes(mimeType);
  if (isRaster && content.byteLength > CHAT_FILES.imageCompressAbove) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, CHAT_FILES.imageMaxDim / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', CHAT_FILES.imageQuality));
      if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', CHAT_FILES.imageQuality));
      if (blob && blob.size < content.byteLength) {
        content = new Uint8Array(await blob.arrayBuffer());
        mimeType = blob.type;
        filename = filename.replace(/\.[^.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg');
      }
    } catch { /* compression impossible : on garde l'original */ }
  }

  if (content.byteLength > CHAT_FILES.maxBytes) {
    throw new Error(`File too large (${formatBytes(content.byteLength)}, max ${CHAT_FILES.maxLabel}). Compress it or split it.`);
  }
  return { filename: filename.slice(0, 120), mimeType, content };
}

async function firstReader(urls) {
  for (const url of urls) {
    try {
      const p = new ethers.JsonRpcProvider(url, 56, { staticNetwork: true, batchMaxCount: 1 });
      await p.getBlockNumber();
      return p;
    } catch { /* RPC suivant */ }
  }
  throw new Error('No RPC available');
}

async function blockAtOrAfter(p, ts, head) {
  const latest = await p.getBlock(head);
  let lo = Math.max(0, head - Math.ceil((latest.timestamp - ts) / 0.4) - 50_000);
  let hi = head;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const b = await p.getBlock(mid);
    if (b.timestamp < ts) lo = mid + 1; else hi = mid;
  }
  return lo;
}

const cacheKey = (contract, id) => `joobEvidence1:${contract.toLowerCase()}:${id}`;

/**
 * Preuves on-chain d'un escrow en litige : empreinte jointe a l'ouverture (DisputeOpened, si non nulle)
 * puis chaque EvidenceSubmitted. Lecture incrementale, mise en cache dans le navigateur.
 * Renvoie [{ party, hash, txHash, blockNumber, time, kind }], du plus ancien au plus recent.
 */
export async function readEvidence(contract, escrowId, disputeOpenedAt, rpcUrls = EVIDENCE_RPCS) {
  if (!disputeOpenedAt) return [];
  const idTopic = ethers.zeroPadValue(ethers.toBeHex(BigInt(escrowId)), 32);
  let cache = null;
  try { cache = JSON.parse(localStorage.getItem(cacheKey(contract, escrowId)) || 'null'); } catch {}

  const p = await firstReader(rpcUrls);
  const head = await p.getBlockNumber();
  let from = cache?.scannedTo ? cache.scannedTo + 1 : await blockAtOrAfter(p, Number(disputeOpenedAt), head);
  const items = cache?.items ? [...cache.items] : [];

  for (; from <= head; from += EVIDENCE_LOG_WINDOW) {
    const to = Math.min(from + EVIDENCE_LOG_WINDOW - 1, head);
    const logs = await p.getLogs({ address: contract, fromBlock: from, toBlock: to, topics: [[TOPIC_DISPUTE, TOPIC_EVIDENCE], idTopic] });
    for (const l of logs) {
      const ev = IFACE.parseLog({ topics: l.topics, data: l.data });
      if (ev.args.evidenceHash === ethers.ZeroHash) continue;
      if (items.some((x) => x.txHash === l.transactionHash && x.hash === ev.args.evidenceHash)) continue;
      const b = await p.getBlock(l.blockNumber);
      items.push({
        party: ev.name === 'DisputeOpened' ? ev.args.opener : ev.args.party,
        hash: ev.args.evidenceHash,
        txHash: l.transactionHash,
        blockNumber: l.blockNumber,
        time: b.timestamp,
        kind: ev.name === 'DisputeOpened' ? 'dispute' : 'evidence',
      });
    }
  }
  items.sort((a, b) => a.blockNumber - b.blockNumber);
  try { localStorage.setItem(cacheKey(contract, escrowId), JSON.stringify({ scannedTo: head, items })); } catch {}
  return items;
}
