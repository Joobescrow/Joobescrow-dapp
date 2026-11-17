'use client';

// Page « Pay button » (/pay-button) : un bouton « Pay with JoobEscrow » permanent a ajouter a son site,
// independant d'un paiement en cours. Le bouton est un simple lien stylise vers une demande de paiement
// (montant facultatif : sans montant, le client saisit la somme) ; le paiement se fait toujours sur joobescrow.com.
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useToast } from '../context/ToastContext';
import { instances } from '../config/instances';
import { PAID_TOKENS, FEE_MIN_USD, FEE_MAX_USD } from '../config/feeTiers';
import { buildPayLink, buildPayButtonHtml, PAY_AMOUNT_PATTERN, DEFAULT_PAY_CATEGORY } from '../config/payLink';
import { REF_PATTERN, REF_MAX_LENGTH, cleanReference } from '../lib/escrowReference';
import './CreateEscrowModal.css';

const TYPES = Object.values(instances).filter((n) => !n.isDemo);

export default function PayButtonBuilder({ onClose }) {
  const { account } = useWeb3();
  const { showToast } = useToast();
  const [category, setCategory] = useState(DEFAULT_PAY_CATEGORY);
  const [addr, setAddr] = useState(account || '');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(PAID_TOKENS[0]);
  const [reference, setReference] = useState('');
  const [copied, setCopied] = useState(false);

  // Le wallet peut se connecter apres l'ouverture : on le reprend tant que le champ est vide.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (account && !addr) setAddr(account);
  }, [account, addr]);

  const a = addr.trim();
  const addrOk = Boolean(a) && ethers.isAddress(a);
  const amt = amount.trim();
  const amountOk = amt === '' || (PAY_AMOUNT_PATTERN.test(amt) && Number(amt) >= FEE_MIN_USD && Number(amt) <= FEE_MAX_USD);
  const ref = reference.trim();
  const refOk = ref.length <= REF_MAX_LENGTH && REF_PATTERN.test(ref);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.joobescrow.com';
  const link = addrOk && amountOk && refOk
    ? buildPayLink({ origin, category, provider: a, amount: amt, token, reference: cleanReference(ref) })
    : '';
  const html = link ? buildPayButtonHtml(link, amt ? { amount: amt, token } : {}) : '';

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
      '<html lang="en"><head><meta charset="utf-8"><title>JoobEscrow pay button</title></head>',
      '<body>',
      '<!-- JoobEscrow pay button. Copy the <a> tag below into your website. Clicking it opens your payment request on joobescrow.com: payment always happens there. -->',
      html,
      '</body></html>',
      '',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([file], { type: 'text/html' }));
    const el = document.createElement('a');
    el.href = url;
    el.download = 'joobescrow-pay-button.html';
    el.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content is-form" style={{ maxWidth: '540px' }}>
        <h2>Pay button</h2>
        <div className="modal-body">
          <p className="form-hint" style={{ marginTop: 0, marginBottom: '16px' }}>
            Add a &quot;Pay with JoobEscrow&quot; button to your website or portfolio, once. Your clients click it and pay you
            through an escrow on joobescrow.com.
          </p>

          <div className="form-group">
            <label htmlFor="pb-type">Type of deal</label>
            <select id="pb-type" value={category} onChange={(e) => setCategory(e.target.value)}>
              {TYPES.map((n) => (
                <option key={n.slug} value={n.slug}>{n.name} ({n.lexicon.client} pays, {n.lexicon.provider} gets paid)</option>
              ))}
            </select>
          </div>

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

          <div className="paybtn-block" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            <label className="paybtn-label">Your button</label>
            {html ? (
              <>
                <div className="paybtn-preview" dangerouslySetInnerHTML={{ __html: html }} />
                <pre className="paybtn-code">{html}</pre>
                <p className="form-hint" style={{ margin: 0 }}>
                  Paste this HTML anywhere on your site. Clicking it opens your payment request on joobescrow.com: payment always happens on our site.
                </p>
              </>
            ) : (
              <>
                <div className="paybtn-preview is-placeholder"><span className="paybtn-sample">Pay with JoobEscrow</span></div>
                <p className="form-hint" style={{ margin: 0 }}>Enter your wallet address above to get your button.</p>
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
