// Configuration and validation for prefilled payment links ("Pay me with JoobEscrow").
// Single source of truth for pay link parameters, limits, and validation logic.

import { ethers } from 'ethers';
import { PAID_TOKENS, FEE_MIN_USD, FEE_MAX_USD } from './feeTiers';
import { REF_PATTERN, REF_MAX_LENGTH, cleanReference } from '../lib/escrowReference';
import { instances } from './instances';

export const PAY_PARAM_PROVIDER = 'pay';
export const PAY_PARAM_AMOUNT = 'amount';
export const PAY_PARAM_TOKEN = 'token';
export const PAY_PARAM_REF = 'ref';
export const PAY_PARAM_CATEGORY = 'category';
export const PAY_PARAM_KOL = 'kol';

export const DEFAULT_PAY_CATEGORY = 'talent';

// Montant accepte dans un lien : entier ou 2 decimales au plus (montant en dollars).
export const PAY_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

// Supported tokens for payment links (USDT, USDC).
export const PAY_SUPPORTED_TOKENS = PAID_TOKENS;

/**
 * Validates a category slug. Demo is excluded from payment links.
 */
export function isValidPayCategory(slug) {
  if (!slug || typeof slug !== 'string') return false;
  const clean = slug.trim().toLowerCase();
  if (clean === 'demo') return false;
  return Object.prototype.hasOwnProperty.call(instances, clean);
}

/**
 * Validates and parses raw pay link search parameters.
 * Strict validation: if any required parameter is invalid or out of bounds,
 * returns { isValid: false, reason: string, data: null } so that the form is never
 * misleadingly half-filled.
 *
 * @param {URLSearchParams|object} searchParams
 * @returns {{ isValid: boolean, reason?: string, errorParam?: string, data: object|null }}
 */
export function parsePayParams(searchParams) {
  if (!searchParams) return { isValid: false, reason: 'No parameters provided', data: null };

  const get = (key) => {
    if (typeof searchParams.get === 'function') return searchParams.get(key);
    return searchParams[key] || null;
  };

  const rawProvider = get(PAY_PARAM_PROVIDER);
  // If no 'pay' param is present, this is not a pay link request.
  if (!rawProvider) {
    return { isValid: false, reason: 'No pay parameter', data: null };
  }

  // 1. Provider address validation
  const providerTrimmed = String(rawProvider).trim();
  if (!ethers.isAddress(providerTrimmed)) {
    return {
      isValid: false,
      reason: 'The provider address in the payment link is invalid.',
      errorParam: PAY_PARAM_PROVIDER,
      data: null,
    };
  }
  const checksumProvider = ethers.getAddress(providerTrimmed);

  // 2. Amount validation
  const rawAmount = get(PAY_PARAM_AMOUNT);
  if (!rawAmount || String(rawAmount).trim() === '') {
    return {
      isValid: false,
      reason: 'Payment amount is missing in the payment link.',
      errorParam: PAY_PARAM_AMOUNT,
      data: null,
    };
  }

  // Format strict : refuse 100abc, 1e3 ou 0x10, que parseFloat accepterait.
  const amountStr = String(rawAmount).trim();
  const numAmount = PAY_AMOUNT_PATTERN.test(amountStr) ? Number(amountStr) : NaN;
  if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
    return {
      isValid: false,
      reason: 'Payment amount must be a valid positive number.',
      errorParam: PAY_PARAM_AMOUNT,
      data: null,
    };
  }

  if (numAmount < FEE_MIN_USD || numAmount > FEE_MAX_USD) {
    return {
      isValid: false,
      reason: `Payment amount must be between $${FEE_MIN_USD} and $${FEE_MAX_USD.toLocaleString('en-US')}.`,
      errorParam: PAY_PARAM_AMOUNT,
      data: null,
    };
  }

  // Format amount cleanly (up to 2 decimals if decimal, otherwise integer)
  const cleanAmount = String(rawAmount).trim();

  // 3. Token validation
  const rawToken = get(PAY_PARAM_TOKEN);
  const tokenUpper = rawToken ? String(rawToken).trim().toUpperCase() : 'USDT';
  if (!PAY_SUPPORTED_TOKENS.includes(tokenUpper)) {
    return {
      isValid: false,
      reason: `Unsupported token "${rawToken}". Payment links only support ${PAY_SUPPORTED_TOKENS.join(' or ')}.`,
      errorParam: PAY_PARAM_TOKEN,
      data: null,
    };
  }

  // 4. Reference validation (optional)
  const rawRef = get(PAY_PARAM_REF) || get('reference');
  let cleanRef = '';
  if (rawRef) {
    const trimmedRef = String(rawRef).trim();
    if (trimmedRef.length > REF_MAX_LENGTH) {
      return {
        isValid: false,
        reason: `Reference is too long (maximum ${REF_MAX_LENGTH} characters).`,
        errorParam: PAY_PARAM_REF,
        data: null,
      };
    }
    if (!REF_PATTERN.test(trimmedRef)) {
      return {
        isValid: false,
        reason: 'Reference contains invalid characters. Use letters, numbers, spaces, dots, hyphens, and underscores only.',
        errorParam: PAY_PARAM_REF,
        data: null,
      };
    }
    cleanRef = cleanReference(trimmedRef);
  }

  // 5. Category (optional parameter in link, validated if present)
  const rawCat = get(PAY_PARAM_CATEGORY);
  let resolvedCategory = null;
  if (rawCat) {
    const catClean = String(rawCat).trim().toLowerCase();
    if (catClean === 'demo' || !Object.prototype.hasOwnProperty.call(instances, catClean)) {
      return {
        isValid: false,
        reason: `Category "${rawCat}" is not a valid escrow category.`,
        errorParam: PAY_PARAM_CATEGORY,
        data: null,
      };
    }
    resolvedCategory = catClean;
  }

  return {
    isValid: true,
    data: {
      provider: checksumProvider,
      amount: cleanAmount,
      token: tokenUpper,
      reference: cleanRef,
      category: resolvedCategory,
    },
  };
}

/**
 * Builds a payment URL for a provider.
 *
 * @param {object} params
 * @param {string} [params.origin] - e.g. "https://joobescrow.com" or window.location.origin
 * @param {string} params.category - niche slug (e.g. "talent", "dev", "pro")
 * @param {string} params.provider - provider wallet address (checksummed)
 * @param {string|number} params.amount - amount in token units (USD equivalent)
 * @param {string} params.token - "USDT" or "USDC"
 * @param {string} [params.reference] - optional escrow reference
 * @returns {string} Fully formed payment URL
 */
export function buildPayLink({ origin = '', category = DEFAULT_PAY_CATEGORY, provider, amount, token = 'USDT', reference = '' }) {
  const cat = isValidPayCategory(category) ? category.trim().toLowerCase() : DEFAULT_PAY_CATEGORY;
  const base = origin ? `${origin.replace(/\/+$/, '')}/${cat}` : `/${cat}`;
  const params = new URLSearchParams();

  if (provider && ethers.isAddress(provider.trim())) {
    params.set(PAY_PARAM_PROVIDER, ethers.getAddress(provider.trim()));
  }
  if (amount) {
    params.set(PAY_PARAM_AMOUNT, String(amount).trim());
  }
  if (token) {
    params.set(PAY_PARAM_TOKEN, String(token).trim().toUpperCase());
  }
  if (reference) {
    const cleaned = cleanReference(reference);
    if (cleaned) params.set(PAY_PARAM_REF, cleaned);
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// Bouton « Pay with JoobEscrow » a coller sur un site (niveau 1 du widget) : un simple lien stylise
// vers notre lien de paiement. Aucune transaction sur le site du marchand : le paiement se fait sur joobescrow.com.
export const PAY_BUTTON = {
  label: 'with JoobEscrow',
  background: '#A3E635',
  color: '#052e16',
  border: '#BEF264',
};

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Code HTML du bouton (styles en ligne, sans script ni fichier externe). */
export function buildPayButtonHtml(link, { amount, token } = {}) {
  if (!link) return '';
  const b = PAY_BUTTON;
  const what = amount && token ? `Pay ${escapeHtml(amount)} ${escapeHtml(token)}` : 'Pay';
  const style = [
    'display:inline-flex', 'align-items:center', 'gap:8px', 'padding:12px 20px',
    `background:${b.background}`, `color:${b.color}`, `border:1px solid ${b.border}`, 'border-radius:10px',
    'font:700 15px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif', 'text-decoration:none',
  ].join(';');
  const lock = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${b.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
  return `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" style="${style}">${lock}${what} ${escapeHtml(b.label)}</a>`;
}
