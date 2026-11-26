// Media kit public (/media-kit) : fichiers officiels pour partenaires et medias.
// Images et texte uniquement (aucun executable). Les fichiers sont dans public/media-kit/ ;
// le zip contient exactement les memes images. Adresses et liens : lus dans les configs existantes.
import { CONTRACT_5_PERCENT, CONTRACT_3_PERCENT, CONTRACT_2_PERCENT, CONTRACT_DEMO } from './instances';
import { PRESALE_ADDRESSES } from './presale';
import { TELEGRAM_URL, TELEGRAM_CHANNEL_URL, TELEGRAM_BOT_URL, X_URL } from './links';

const DIR = '/media-kit';

export const MEDIA_KIT = {
  zip: `${DIR}/joobescrow-media-kit.zip`,
  description: 'JoobEscrow is a non-custodial escrow on BNB Chain. The client locks USDT or USDC in an audited smart contract before work starts, and the provider is paid on delivery. Disputes are settled by a 3-of-5 Safe multisig.',
  logos: [
    { label: 'Logo, transparent PNG', file: `${DIR}/joobescrow-logo-1024.png`, size: '1024 x 1024' },
    { label: 'Logo, SVG', file: `${DIR}/joobescrow-logo.svg`, size: 'vector' },
    { label: 'Horizontal logo, dark background', file: `${DIR}/joobescrow-logo-horizontal-dark-1240x400.png`, size: '1240 x 400', dark: true },
    { label: 'Horizontal logo, SVG', file: `${DIR}/joobescrow-logo-horizontal-dark.svg`, size: 'vector', dark: true },
  ],
  banners: [
    { label: 'Banner', file: `${DIR}/joobescrow-banner-1500x500.png`, size: '1500 x 500' },
    { label: 'Banner, high resolution', file: `${DIR}/joobescrow-banner-3000x1000.png`, size: '3000 x 1000' },
    { label: 'Share image', file: `${DIR}/joobescrow-share-1200x630.png`, size: '1200 x 630' },
  ],
  colors: [
    { name: 'Green', hex: '#22C55E' },
    { name: 'Lime', hex: '#A3E635' },
    { name: 'Dark background', hex: '#05080A' },
  ],
  links: [
    { label: 'Website', href: 'https://www.joobescrow.com', text: 'joobescrow.com' },
    { label: 'X', href: X_URL, text: 'x.com/joobescrow' },
    { label: 'Telegram announcements', href: TELEGRAM_CHANNEL_URL, text: 't.me/joobescrow_channel' },
    { label: 'Telegram community', href: TELEGRAM_URL, text: 't.me/joobescrow_group' },
    { label: 'Telegram bot', href: TELEGRAM_BOT_URL, text: '@JoobEscrowBot' },
    { label: 'Email', href: 'mailto:contact@joobescrow.com', text: 'contact@joobescrow.com' },
  ],
  contracts: [
    { label: 'Escrow, 5% fee (deals under $1,000)', address: CONTRACT_5_PERCENT },
    { label: 'Escrow, 3% fee (from $1,000)', address: CONTRACT_3_PERCENT },
    { label: 'Escrow, 2% fee (from $10,000)', address: CONTRACT_2_PERCENT },
    { label: '$1 demo escrow (0% fee)', address: CONTRACT_DEMO },
    { label: 'JOOB token', address: PRESALE_ADDRESSES.TOKEN },
    { label: 'JOOB presale', address: PRESALE_ADDRESSES.PRESALE },
    { label: 'Safe 3-of-5 multisig (owner of all contracts)', address: PRESALE_ADDRESSES.SAFE },
  ],
  rules: [
    'Use the logo as provided: do not change its colors, shape or proportions.',
    'Do not state or suggest any token price, listing price or return.',
    'Only link to joobescrow.com and the official accounts listed on this page.',
  ],
};
