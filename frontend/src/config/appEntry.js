// Accueil de l'app (/app) : deux entrees selon l'intention (UX direction 2).
// La categorie ne sert qu'au vocabulaire des roles (les frais sont les memes partout) :
// « Pay someone » ouvre directement le formulaire dans une categorie generique.
export const PAY_SOMEONE_CATEGORY = 'pro'; // Client <-> Expert
export const OPEN_CREATE_PARAM = 'new'; // /<categorie>?new=1 ouvre le formulaire de creation
export const GET_PAID_PATH = '/pay';

// Page d'accueil du site : les 3 entrees de l'app (memes mots que le menu de l'app).
export const HOME_APP_ENTRIES = [
  { key: 'pay', title: 'Pay someone', desc: 'Lock the payment in escrow and release it when the work is delivered. 0% fee for you.', cta: 'Start an escrow', href: `/${PAY_SOMEONE_CATEGORY}?${OPEN_CREATE_PARAM}=1` },
  { key: 'paid', title: 'Get paid', desc: 'Send your client a payment link. You see the funds locked before you start the work.', cta: 'Create a payment link', href: GET_PAID_PATH },
  { key: 'button', title: 'Pay button', desc: 'Add a pay button to your website, or a "Secure your deal" button for your community.', cta: 'Get your button', href: '/pay-button' },
];
