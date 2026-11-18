// Recu PDF d'un escrow, genere dans le navigateur a partir des donnees on-chain (aucun serveur, aucun envoi).
// Chaque partie le telecharge et le transmet elle-meme (mail, chat chiffre). Tout est verifiable sur BscScan.
import { ethers } from 'ethers';
import { USDT_ADDRESS, USDC_ADDRESS } from '../config/contract';
import { findCreationTxHash, readEscrowReference } from './escrowReference';
import { RECEIPT } from '../config/receipt';

const ABI = ['function escrows(uint256) view returns (address client, address provider, address token, uint256 amount, uint256 feeBPS, uint256 createdAt, uint256 timeoutDate, uint8 status, bool accepted)'];
const TOKENS = { [USDT_ADDRESS.toLowerCase()]: 'USDT', [USDC_ADDRESS.toLowerCase()]: 'USDC' };
const DECIMALS = 18; // USDT et USDC BEP-20
const STATUS = { 1: 'Funded', 2: 'Completed (released to the provider)', 3: 'In dispute', 4: 'Completed (dispute settled)', 5: 'Cancelled (refunded to the client)' };

const fmtUnits = (v) => Number(ethers.formatUnits(v, DECIMALS)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const fmtDate = (s) => (Number(s) > 0 ? new Date(Number(s) * 1000).toUTCString().replace(' GMT', ' UTC') : 'n/a');

/** Lit l'escrow sur la chaine et prepare les lignes du recu. */
export async function receiptData({ provider, contract, escrowId, niche, origin, dealPath }) {
  const c = new ethers.Contract(contract, ABI, provider);
  const e = await c.escrows(escrowId);
  const status = Number(e.status);
  const token = TOKENS[e.token.toLowerCase()] || e.token;
  const fee = (e.amount * e.feeBPS) / 10000n;
  const [reference, creationTx] = await Promise.all([
    readEscrowReference(provider, contract, escrowId, e.createdAt).catch(() => null),
    findCreationTxHash(provider, contract, escrowId, e.createdAt).catch(() => null),
  ]);

  let outcome;
  if (status === 2) outcome = `${fmtUnits(e.amount - fee)} ${token} to the ${niche.lexicon.provider.toLowerCase()} (after the escrow fee)`;
  else if (status === 4) outcome = 'Split decided in the dispute: see the contract events on BscScan';
  else if (status === 5) outcome = `${fmtUnits(e.amount)} ${token} refunded to the ${niche.lexicon.client.toLowerCase()}`;
  else outcome = 'Not settled yet';

  return {
    id: String(escrowId),
    status: STATUS[status] || `Status ${status}`,
    rows: [
      ['Type of deal', niche.name],
      ['Network', 'BNB Smart Chain'],
      ['Escrow contract', contract],
      [`${niche.lexicon.client} (pays)`, e.client],
      [`${niche.lexicon.provider} (gets paid)`, e.provider],
      ['Amount locked', `${fmtUnits(e.amount)} ${token}`],
      ['Escrow fee (paid by the provider)', `${Number(e.feeBPS) / 100}% = ${fmtUnits(fee)} ${token}`],
      ['Payout', outcome],
      ['Created', fmtDate(e.createdAt)],
      ['Delivery deadline', fmtDate(e.timeoutDate)],
      ['Reference', reference || 'none'],
      ...(creationTx ? [['Creation transaction', creationTx]] : []),
    ],
    links: [
      ['Deal page', `${origin}${dealPath}`],
      ['Contract on BscScan', `https://bscscan.com/address/${contract}`],
      ...(creationTx ? [['Creation transaction on BscScan', `https://bscscan.com/tx/${creationTx}`]] : []),
    ],
  };
}

/** Genere le PDF et le telecharge (jsPDF charge a la demande). */
export async function downloadReceipt(args) {
  const d = await receiptData(args);
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 56;

  doc.setFillColor(...RECEIPT.accentRgb);
  doc.rect(0, 0, W, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text(`${RECEIPT.title} #${d.id}`, M, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(d.status, M, y);
  y += 26;

  doc.setFontSize(10);
  for (const [k, v] of d.rows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(k, M, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(String(v), W - M - 230);
    doc.text(lines, 230, y);
    y += 14 * Math.max(1, lines.length) + 6;
  }

  y += 8;
  doc.setDrawColor(220, 220, 220);
  doc.line(M, y, W - M, y);
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Verify', M, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  for (const [k, url] of d.links) {
    doc.setTextColor(60, 60, 60);
    doc.text(`${k}:`, M, y);
    doc.setTextColor(...RECEIPT.linkRgb);
    const lines = doc.splitTextToSize(url, W - M - 230);
    doc.textWithLink(lines[0], 230, y, { url });
    if (lines.length > 1) doc.text(lines.slice(1), 230, y + 13);
    y += 13 * lines.length + 6;
  }

  y += 14;
  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  const foot = doc.splitTextToSize(`${RECEIPT.disclaimer} Generated on ${new Date().toUTCString().replace(' GMT', ' UTC')}.`, W - 2 * M);
  doc.text(foot, M, y);

  doc.save(`JoobEscrow_receipt_${d.id}.pdf`);
}
