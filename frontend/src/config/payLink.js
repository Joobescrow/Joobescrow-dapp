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

  // 2. Amount validation : facultatif (bouton de site sans montant fixe : le client saisit la somme).
  const rawAmount = get(PAY_PARAM_AMOUNT);
  const amountStr = rawAmount == null ? '' : String(rawAmount).trim();
  if (amountStr !== '') {
    // Format strict : refuse 100abc, 1e3 ou 0x10, que parseFloat accepterait.
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
  }

  // Format amount cleanly (up to 2 decimals if decimal, otherwise integer)
  const cleanAmount = amountStr; // '' si le lien ne fixe pas de montant

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

// Boutons a coller sur un site (niveau 1 du widget) : de simples liens stylises, sans script ni fichier externe.
// Aucune transaction sur le site qui les affiche : le paiement se fait toujours sur joobescrow.com.
//  - mode « Clients pay me » : lien de paiement vers le prestataire (montant facultatif) ;
//  - mode « My community pays each other » : ouvre « Pay someone » sans destinataire (chacun saisit l'autre partie),
//    avec un code partenaire facultatif (?ref=, trace l'origine ; jamais de ?pay= dans ce lien).
export const PAY_BUTTON_LABELS = {
  pay: 'Pay with JoobEscrow',
  payAmount: (amount, token) => `Pay ${amount} ${token} with JoobEscrow`,
  community: 'Secure your deal with JoobEscrow',
};

export const PAY_BUTTON_THEMES = {
  lime: { name: 'Lime', background: '#A3E635', color: '#052e16', border: '#BEF264', icon: '#052e16' },
  dark: { name: 'Dark', background: '#111613', color: '#F2F5F3', border: '#2A362E', icon: '#A3E635' },
};

export const PAY_BUTTON_SIZES = {
  standard: { name: 'Standard', padding: '12px 20px', font: 15, icon: 16 },
  compact: { name: 'Compact', padding: '8px 14px', font: 13, icon: 14 },
};

// Compatibilite : ancien nom (theme Lime).
export const PAY_BUTTON = { ...PAY_BUTTON_THEMES.lime, label: 'with JoobEscrow' };

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Code HTML du bouton (styles en ligne). label : texte deja choisi ; sinon « Pay [montant] with JoobEscrow ». */
export function buildPayButtonHtml(link, { amount, token, theme = 'lime', size = 'standard', label } = {}) {
  if (!link) return '';
  const t = PAY_BUTTON_THEMES[theme] || PAY_BUTTON_THEMES.lime;
  const z = PAY_BUTTON_SIZES[size] || PAY_BUTTON_SIZES.standard;
  const text = label || (amount && token ? PAY_BUTTON_LABELS.payAmount(amount, token) : PAY_BUTTON_LABELS.pay);
  const style = [
    'display:inline-flex', 'align-items:center', 'gap:8px', `padding:${z.padding}`,
    `background:${t.background}`, `color:${t.color}`, `border:1px solid ${t.border}`, 'border-radius:10px',
    `font:700 ${z.font}px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif`, 'text-decoration:none',
  ].join(';');
  const lock = `<svg width="${z.icon}" height="${z.icon}" viewBox="0 0 24 24" fill="none" stroke="${t.icon}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
  return `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" style="${style}">${lock}${escapeHtml(text)}</a>`;
}

// Code partenaire du bouton communaute : meme format que les handles KOL (lettres minuscules, chiffres, _).
export const PARTNER_CODE_PATTERN = /^[a-z0-9_]{2,32}$/;

/** Lien du bouton communaute : /<categorie>?new=1 (ouvre « Pay someone »), + &ref=<code> si fourni. Jamais de ?pay=. */
export function buildCommunityLink({ origin = '', category = DEFAULT_PAY_CATEGORY, partner = '' }) {
  const cat = isValidPayCategory(category) ? category.trim().toLowerCase() : DEFAULT_PAY_CATEGORY;
  const params = new URLSearchParams({ new: '1' });
  const code = String(partner || '').trim().toLowerCase();
  if (code && PARTNER_CODE_PATTERN.test(code)) params.set('ref', code);
  return `${origin.replace(/\/+$/, '')}/${cat}?${params.toString()}`;
}
