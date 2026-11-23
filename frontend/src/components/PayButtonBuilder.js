'use client';

// Page « Pay button » (/pay-button) : bouton permanent a ajouter a un site, deux modes.
//  - « Clients pay me » : lien de paiement vers le prestataire (montant facultatif : sans montant, le client saisit la somme).
//  - « My community pays each other » : ouvre « Pay someone » sans destinataire (groupes OTC, forums, marketplaces),
//    code partenaire facultatif (?ref=). Le paiement se fait toujours sur joobescrow.com.
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import QRCode from 'qrcode';
import { useWeb3 } from '../context/Web3Context';
import { useToast } from '../context/ToastContext';
import { instances } from '../config/instances';
import { PAID_TOKENS, FEE_MIN_USD, FEE_MAX_USD } from '../config/feeTiers';
import {
  buildPayLink, buildPayButtonHtml, buildCommunityLink, PAY_AMOUNT_PATTERN, DEFAULT_PAY_CATEGORY,
  PAY_BUTTON_LABELS, PAY_BUTTON_THEMES, PAY_BUTTON_SIZES, PARTNER_CODE_PATTERN, PAY_QR_CODE,
} from '../config/payLink';
import { REF_PATTERN, REF_MAX_LENGTH, cleanReference } from '../lib/escrowReference';
import './CreateEscrowModal.css';

const TYPES = Object.values(instances).filter((n) => !n.isDemo);
const MODES = [
  { key: 'me', label: 'Clients pay me', hint: 'You set the wallet that receives the payment.' },
  { key: 'community', label: 'My community pays each other', hint: "Each visitor enters the other party's wallet." },
];

export default function PayButtonBuilder({ onClose }) {
  const { account } = useWeb3();
  const { showToast } = useToast();
  const [mode, setMode] = useState('me');
  const [category, setCategory] = useState(DEFAULT_PAY_CATEGORY);
  const [addr, setAddr] = useState(account || '');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(PAID_TOKENS[0]);
  const [reference, setReference] = useState('');
  const [partner, setPartner] = useState('');
  const [theme, setTheme] = useState('lime');
  const [size, setSize] = useState('standard');
  const [copied, setCopied] = useState(false);

  // Le wallet peut se connecter apres l'ouverture : on le reprend tant que le champ est vide.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (account && !addr) setAddr(account);
  }, [account, addr]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.joobescrow.com';
  const isCommunity = mode === 'community';

  // Mode « Clients pay me »
  const a = addr.trim();
  const addrOk = Boolean(a) && ethers.isAddress(a);
  const amt = amount.trim();
  const amountOk = amt === '' || (PAY_AMOUNT_PATTERN.test(amt) && Number(amt) >= FEE_MIN_USD && Number(amt) <= FEE_MAX_USD);
  const ref = reference.trim();
  const refOk = ref.length <= REF_MAX_LENGTH && REF_PATTERN.test(ref);

  // Mode communaute
  const code = partner.trim().toLowerCase();
  const partnerOk = code === '' || PARTNER_CODE_PATTERN.test(code);

  let link = '';
  if (isCommunity) {
    if (partnerOk) link = buildCommunityLink({ origin, category, partner: code });
  } else if (addrOk && amountOk && refOk) {
    link = buildPayLink({ origin, category, provider: a, amount: amt, token, reference: cleanReference(ref) });
  }
  const html = link
    ? buildPayButtonHtml(link, isCommunity
      ? { theme, size, label: PAY_BUTTON_LABELS.community }
      : { theme, size, ...(amt ? { amount: amt, token } : {}) })
    : '';

  const copy = () => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopied(true);
    showToast('success', 'Button code copied. Paste it into your website.');
    setTimeout(() => setCopied(false), 2500);
  };

  const download = () => {
    if (!html) return;
    const file = [
      '<!doctype html>',
      '<html lang="en"><head><meta charset="utf-8"><title>JoobEscrow button</title></head>',
      '<body>',
      '<!-- JoobEscrow button. Copy the <a> tag below into your website. Clicking it opens joobescrow.com: payment always happens there. -->',
      html,
      '</body></html>',
      '',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([file], { type: 'text/html' }));
    const el = document.createElement('a');
    el.href = url;
    el.download = isCommunity ? 'joobescrow-community-button.html' : 'joobescrow-pay-button.html';
    el.click();
    URL.revokeObjectURL(url);
  };

  const qrCanvasRef = useRef(null);
  useEffect(() => {
    if (!link || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, link, {
      width: PAY_QR_CODE.size,
      margin: PAY_QR_CODE.margin,
      errorCorrectionLevel: PAY_QR_CODE.errorCorrectionLevel,
      color: PAY_QR_CODE.color,
    }).catch(() => {});
  }, [link]);

  const downloadQr = async () => {
    if (!link) return;
    try {
      const dataUrl = await QRCode.toDataURL(link, {
        width: PAY_QR_CODE.downloadSize,
        margin: PAY_QR_CODE.margin,
        errorCorrectionLevel: PAY_QR_CODE.errorCorrectionLevel,
        color: PAY_QR_CODE.color,
      });
      const el = document.createElement('a');
      el.href = dataUrl;
      el.download = isCommunity ? PAY_QR_CODE.filenames.communityButton : PAY_QR_CODE.filenames.payButton;
      el.click();
    } catch {
      showToast('error', 'Could not generate the QR code.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content is-form" style={{ maxWidth: '560px' }}>
        <h2>Pay button</h2>
        <div className="modal-body">
          <p className="form-hint" style={{ marginTop: 0, marginBottom: '14px' }}>
            Add a JoobEscrow button to your website, once. Anyone who clicks it opens a secure escrow on joobescrow.com.
          </p>

          <div className="pb-modes" role="tablist" aria-label="Button type">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={mode === m.key}
                className={`pb-mode ${mode === m.key ? 'is-active' : ''}`}
                onClick={() => setMode(m.key)}
              >
                <strong>{m.label}</strong>
                <span>{m.hint}</span>
              </button>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="pb-type">Type of deal</label>
            <select id="pb-type" value={category} onChange={(e) => setCategory(e.target.value)}>
              {TYPES.map((n) => (
                <option key={n.slug} value={n.slug}>{n.name} ({n.lexicon.client} pays, {n.lexicon.provider} gets paid)</option>
              ))}
            </select>
          </div>

          {isCommunity ? (
            <div className="form-group">
              <label htmlFor="pb-partner">Partner code (optional)</label>
              <input id="pb-partner" type="text" value={partner} onChange={(e) => setPartner(e.target.value)} maxLength={32} placeholder="e.g. alpha_otc" />
              {partnerOk
                ? <p className="form-hint">We use it to see which escrows were opened from your button.</p>
                : <p className="form-hint is-error">2 to 32 characters: lowercase letters, numbers and underscores.</p>}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="pb-addr">You receive the payment at</label>
                <input id="pb-addr" type="text" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x..." />
                {a && !addrOk
                  ? <p className="form-hint is-error">Please enter a valid BSC wallet address.</p>
                  : <p className="form-hint">Your connected wallet by default.</p>}
              </div>

              <div className="form-group">
                <label htmlFor="pb-amount">Fixed amount (optional)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input id="pb-amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Leave empty: the client enters it" style={{ flex: '1 1 auto' }} />
                  <select value={token} onChange={(e) => setToken(e.target.value)} style={{ width: '110px', flex: '0 0 auto' }} aria-label="Token">
                    {PAID_TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {amountOk
                  ? <p className="form-hint">Set an amount for a fixed-price service, or leave it empty.</p>
                  : <p className="form-hint is-error">Amount must be between ${FEE_MIN_USD} and ${FEE_MAX_USD.toLocaleString('en-US')}, with 2 decimals at most.</p>}
              </div>

              <div className="form-group">
                <label htmlFor="pb-ref">Reference (optional)</label>
                <input id="pb-ref" type="text" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={REF_MAX_LENGTH} placeholder="e.g. Logo design" />
                {!refOk && <p className="form-hint is-error">Letters, numbers, spaces, dots, hyphens and underscores only.</p>}
              </div>
            </>
          )}

          <div className="pb-style">
            <div className="form-group">
              <label htmlFor="pb-theme">Style</label>
              <select id="pb-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
                {Object.entries(PAY_BUTTON_THEMES).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="pb-size">Size</label>
              <select id="pb-size" value={size} onChange={(e) => setSize(e.target.value)}>
                {Object.entries(PAY_BUTTON_SIZES).map(([k, z]) => <option key={k} value={k}>{z.name}</option>)}
              </select>
            </div>
          </div>

          <div className="paybtn-block" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            <label className="paybtn-label">Your button</label>
            {html ? (
              <>
                <div className="pb-previews">
                  <div className="paybtn-preview" dangerouslySetInnerHTML={{ __html: html }} />
                  <div className="paybtn-preview is-dark" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
                <pre className="paybtn-code">{html}</pre>
                <p className="form-hint" style={{ margin: 0 }}>
                  {isCommunity
                    ? 'Paste this button on your forum, group or marketplace. Visitors enter the other party\'s wallet and lock the funds in an audited escrow contract. We never hold the funds.'
                    : 'Paste this HTML anywhere on your site. Clicking it opens your payment request on joobescrow.com: payment always happens on our site.'}
                </p>
                <div className="pay-qr-card">
                  <div className="pay-qr-frame">
                    <canvas ref={qrCanvasRef} width={PAY_QR_CODE.size} height={PAY_QR_CODE.size} aria-label={PAY_QR_CODE.alt} />
                  </div>
                  <div className="pay-qr-info">
                    <p className="form-hint">{PAY_QR_CODE.hint}</p>
                    <button type="button" className="btn btn-app-secondary" onClick={downloadQr}>
                      {PAY_QR_CODE.downloadLabel}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="paybtn-preview is-placeholder"><span className="paybtn-sample">{isCommunity ? PAY_BUTTON_LABELS.community : PAY_BUTTON_LABELS.pay}</span></div>
                <p className="form-hint" style={{ margin: 0 }}>{isCommunity ? 'Check the partner code above.' : 'Enter your wallet address above to get your button.'}</p>
              </>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-app-secondary" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-app-secondary" onClick={download} disabled={!html}>Download .html</button>
          <button type="button" className="btn btn-app-primary" onClick={copy} disabled={!html}>{copied ? 'Copied!' : 'Copy code'}</button>
        </div>
      </div>
    </div>
  );
}
