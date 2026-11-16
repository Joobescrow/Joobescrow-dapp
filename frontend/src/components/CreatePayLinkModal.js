'use client';

import { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useToast } from '../context/ToastContext';
import { useNiche } from '../context/NicheContext';
import { instances } from '../config/instances';
import { PAID_TOKENS, FEE_MIN_USD, FEE_MAX_USD, tierForAmount } from '../config/feeTiers';
import { buildPayLink, isValidPayCategory } from '../config/payLink';
import { REF_PATTERN, REF_MAX_LENGTH, cleanReference } from '../lib/escrowReference';
import './CreateEscrowModal.css';

// Filter out demo from categories suitable for payment links.
const PAY_CATEGORIES = Object.values(instances).filter((inst) => inst.slug !== 'demo');

export default function CreatePayLinkModal({ onClose, defaultCategory = null }) {
  const { account } = useWeb3();
  const currentNiche = useNiche();
  const { showToast } = useToast();

  const initialCat = isValidPayCategory(defaultCategory)
    ? defaultCategory
    : (isValidPayCategory(currentNiche?.slug) ? currentNiche.slug : 'talent');

  const [category, setCategory] = useState(initialCat);
  const [providerAddr, setProviderAddr] = useState(account || '');
  const [amount, setAmount] = useState('250');
  const [token, setToken] = useState(PAID_TOKENS[0]);
  const [reference, setReference] = useState('');
  const [copied, setCopied] = useState(false);

  // Address validation
  const trimmedAddr = providerAddr.trim();
  const isAddrValid = Boolean(trimmedAddr && ethers.isAddress(trimmedAddr));

  // Amount validation
  const numAmount = parseFloat(amount);
  const isAmountValid = !isNaN(numAmount) && isFinite(numAmount) && numAmount >= FEE_MIN_USD && numAmount <= FEE_MAX_USD;

  // Reference validation
  const trimmedRef = reference.trim();
  const isRefValid = trimmedRef.length <= REF_MAX_LENGTH && REF_PATTERN.test(trimmedRef);

  // Fee tier preview based on deal amount
  const tier = isAmountValid ? tierForAmount(numAmount) : null;
  const feePct = tier ? tier.bps / 100 : null;
  const feeValue = tier && isAmountValid ? (numAmount * tier.bps) / 10000 : 0;
  const netValue = tier && isAmountValid ? numAmount - feeValue : 0;

  // Build the live payment link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://joobescrow.com';
  const generatedLink = useMemo(() => {
    if (!isAddrValid || !isAmountValid || !isRefValid) return '';
    return buildPayLink({
      origin,
      category,
      provider: trimmedAddr,
      amount: String(amount).trim(),
      token,
      reference: cleanReference(trimmedRef),
    });
  }, [origin, category, trimmedAddr, isAddrValid, amount, isAmountValid, token, trimmedRef, isRefValid]);

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    showToast('success', 'Payment link copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content is-form" style={{ maxWidth: '540px' }}>
        <h2>Request a payment</h2>
        <div className="modal-body">
          <p className="form-hint" style={{ marginTop: 0, marginBottom: '16px' }}>
            Share a prefilled escrow link with your client. When they open it, the escrow form is already configured with your payout address, amount and chosen token.
          </p>

          <div className="form-group">
            <label>Type of deal</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Escrow category"
            >
              {PAY_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name} ({cat.lexicon.provider} ↔ {cat.lexicon.client})
                </option>
              ))}
            </select>
            <p className="form-hint">
              Only changes the words your client sees (for example Freelancer or Creator). Fees are the same for every type.
            </p>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label>You receive the payment at</label>
              {isAddrValid && (
                <a
                  href={`https://bscscan.com/address/${trimmedAddr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="form-label-link"
                >
                  View on BscScan ↗
                </a>
              )}
            </div>
            <input
              type="text"
              value={providerAddr}
              onChange={(e) => setProviderAddr(e.target.value)}
              placeholder="0x..."
              required
            />
            {trimmedAddr && !isAddrValid && (
              <p className="form-hint is-error">Please enter a valid BSC wallet address.</p>
            )}
            {(!trimmedAddr || isAddrValid) && (
              <p className="form-hint">Your connected wallet by default. The client who opens the link pays from their own wallet.</p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="form-group flex-1">
              <label>Amount &amp; Token</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <input
                  type="number"
                  step="0.01"
                  min={FEE_MIN_USD}
                  max={FEE_MAX_USD}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="250.00"
                  required
                  style={{ flex: '1 1 auto' }}
                />
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  style={{ width: '110px', flex: '0 0 auto' }}
                  aria-label="Token"
                >
                  {PAID_TOKENS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {!isAmountValid && (
                <p className="form-hint is-error">
                  Amount must be between ${FEE_MIN_USD} and ${FEE_MAX_USD.toLocaleString('en-US')}.
                </p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Reference / Deal ID (Optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={REF_MAX_LENGTH}
              placeholder="e.g. Invoice_2026_01"
            />
            {!isRefValid ? (
              <p className="form-hint is-error">
                Letters, numbers, spaces, dots, hyphens and underscores only (max {REF_MAX_LENGTH} chars).
              </p>
            ) : (
              <p className="form-hint">
                Public reference stored on-chain in the escrow calldata. Do not put private information.
              </p>
            )}
          </div>

          {tier && isAmountValid && (
            <div className="create-summary-box">
              <div className="create-summary-row">
                <span>Fee Tier ({tier.label})</span>
                <strong>{feePct}%</strong>
              </div>
              <div className="create-summary-row">
                <span>Estimated fee on release</span>
                <strong>-{feeValue.toFixed(2)} {token}</strong>
              </div>
              <div className="create-summary-row is-net">
                <span>Net payout to you (on full release)</span>
                <strong>{netValue.toFixed(2)} {token}</strong>
              </div>
              <div className="create-summary-note">
                Clients pay 0% fees. Escrow fee is deducted solely from provider payout upon release.
              </div>
            </div>
          )}

          {generatedLink ? (
            <div style={{ marginTop: '14px', marginBottom: '6px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca8a1', marginBottom: '6px', fontWeight: 500 }}>
                Generated Payment Link
              </label>
              <div
                style={{
                  background: 'rgba(9, 12, 10, 0.7)',
                  border: '1px solid #2a362e',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '0.82rem',
                  color: '#a3e635',
                  wordBreak: 'break-all',
                  marginBottom: '10px',
                }}
              >
                {generatedLink}
              </div>
              <p className="form-hint" style={{ color: 'var(--app-text-secondary, #9CA8A1)' }}>
                When your client opens this link, the escrow will be ready with your address, amount and selected token. They only need to connect their wallet and confirm.
              </p>
            </div>
          ) : (
            <p className="form-hint is-error">
              Complete the required fields above with valid information to generate the link.
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-app-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-app-primary"
            onClick={handleCopy}
            disabled={!generatedLink}
          >
            {copied ? 'Copied!' : 'Copy Payment Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
