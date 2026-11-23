// Parametres de l'API publique JoobEscrow (api.joobescrow.com) et du bot Telegram.
// Memes valeurs que le site (frontend/src/config/feeTiers.js, instances.js, payLink.js) : a garder alignees.

export const SITE = 'https://www.joobescrow.com';
export const BSCSCAN = 'https://bscscan.com';
export const CHAIN_ID = 56;

// Lecture groupee (Multicall3, meme adresse sur toutes les chaines EVM).
export const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';

export const TOKENS = {
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
};
export const DECIMALS = 18;

// Grille par montant (contrats payants ouverts).
export const FEE_TIERS = [
  { bps: 500, from: 1, to: 999.99, contract: '0x56c2227E06dBC16062179Be397839b101a8e58c7' },
  { bps: 300, from: 1000, to: 9999.99, contract: '0x3EEEA456daCF2247CB0023a70923E60C3E13D6C3' },
  { bps: 200, from: 10000, to: 100000, contract: '0x7986Bd37C4DA6d1822958fCB97E7a284b40DD7Cc' },
];
// Tous les contrats payants (ouverts et fermes) : lus pour les deals et la reputation. La demo n'est jamais comptee.
export const PAID_CONTRACTS = [
  ...FEE_TIERS.map((t) => t.contract),
  '0xa45f887b938a08B295A5b96b6559600632F09Ab0', // ancien 8 %, ferme
  '0xD5B180580D183A7A9278118312207bc8a9C9f89E', // ancien 10 %, ferme
];
export const DEMO_CONTRACT = '0x28b80688749958241E14Fa8181274AE0E649eC0B';

// Alertes /track du bot : la demo a 1 $ est incluse (un nouvel utilisateur peut tester gratuitement
// entre deux de ses wallets). La reputation, elle, n'inclut jamais la demo.
export const ALERTS = {
  includeDemo: true,
  demoTag: '(demo)',
};

export const CATEGORIES = ['influence', 'talent', 'pro', 'trade', 'prime', 'audit', 'dev', 'art', 'gaming', 'realestate', 'music', 'cm', 'domain', 'mergers', 'bounty', 'otc'];
export const DEFAULT_CATEGORY = 'pro';
export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 100000;
export const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
export const REF_PATTERN = /^[A-Za-z0-9 _.\-]{1,64}$/;

export const STATUS = { 0: 'none', 1: 'funded', 2: 'completed', 3: 'disputed', 4: 'resolved', 5: 'cancelled' };

export const OFFICIAL = {
  telegramChannel: 'https://t.me/joobescrow_channel',
  telegramGroup: 'https://t.me/joobescrow_group',
  x: 'https://x.com/joobescrow',
};
