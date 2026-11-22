// Page /shipped : ce qui est en ligne, date par date (le plus recent en premier). Rien d'annonce ici :
// seulement des fonctions utilisables aujourd'hui, chacune avec un lien pour l'essayer ou la verifier.
import { BSCN_ARTICLE_URL } from './links';

export const SHIPPED = [
  { date: '2026-11-22', title: 'Readable by AI assistants', desc: 'A plain summary of JoobEscrow and instructions for AI agents, so assistants can explain the escrow and build a payment link for you.', href: '/llms.txt', cta: 'Read llms.txt' },
  { date: '2026-11-19', title: 'Public reputation profiles', desc: 'Completed deals, volume, disputes and counterparties of any wallet, read from our contracts. No reviews, only on-chain facts.', href: '/u/0x5504732986176ad264dae4897aA7d81B81b78C4C', cta: 'See an example profile' },
  { date: '2026-11-18', title: 'PDF receipts', desc: 'A receipt for every escrow, generated from on-chain data, with links to check every value on BscScan.', href: '/deal/demo/28', cta: 'See a deal page' },
  { date: '2026-11-17', title: 'Pay button for websites and communities', desc: 'A "Pay with JoobEscrow" button for your site or bio, and a "Secure your deal" button for OTC groups, forums and marketplaces.', href: '/pay-button', cta: 'Get your button' },
  { date: '2026-11-16', title: 'Pay someone or get paid in one click', desc: 'A new app home built around two intents. Every escrow card shows who pays, who gets paid and what comes next.', href: '/app', cta: 'Open the app' },
  { date: '2026-11-15', title: 'Payment request links', desc: 'Providers send a pre-filled link. The client opens it, checks the details and locks the funds.', href: '/pay', cta: 'Create a payment link' },
  { date: '2026-11-15', title: 'Encrypted files and on-chain evidence', desc: 'Share files in the end-to-end encrypted chat. In a dispute, record the fingerprint of a file on-chain, never its content.', href: '/how-disputes-work', cta: 'How disputes work' },
  { date: '2026-11-07', title: 'Fees by deal size', desc: '5% under $1,000, 3% up to $9,999.99 and 2% from $10,000, paid by the provider. 0% for the client.', href: '/security#fees', cta: 'See the fee grid' },
  { date: '2026-10-15', title: 'JOOB presale, payable from 7 chains', desc: 'A self-hosted presale with a sealed vault, payable in USDT or USDC on BNB Chain or from 6 other EVM chains.', href: '/presale', cta: 'Open the presale' },
  { date: '2026-10-10', title: 'Team KYC by SpyWolf', desc: 'Identity verification, video statement and video interview, on top of the SpyWolf audits of our contracts.', href: '/security#team', cta: 'See security' },
  { date: '2026-10-01', title: 'The $1 demo', desc: 'Run the full escrow cycle between two of your own wallets with $1, at 0% fee, on the same audited contract.', href: '/try', cta: 'Try it with $1' },
];

export const PRESS = [
  { outlet: 'BSC News', title: 'JoobEscrow and the JOOB token presale (sponsored article)', href: BSCN_ARTICLE_URL },
];
