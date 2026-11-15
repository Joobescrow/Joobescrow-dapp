// Appel a l'action presale affiche sur un escrow de demo termine (RELEASED / RESOLVED).
// Contrat de staking JOOB (audite SpyWolf, ouvre apres le TGE).
export const STAKING_ADDRESS = '0x7949528182876027b1F4B2e43E3a46eb2dADD32b';

export const DEMO_CTA = {
  paragraphs: [
    'You just ran a real escrow on BNB Chain, with no one in the middle.',
    'JOOB is the token behind it: staking is planned to lower escrow fees, up to a full waiver (Escrow V5). The presale is live and the price rises every 2 days.',
  ],
  primary: { label: 'Join the Presale', href: '/presale' },
  secondary: {
    label: 'See the staking contract',
    href: `https://bscscan.com/address/${STAKING_ADDRESS}`,
  },
};
