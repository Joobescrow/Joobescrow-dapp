// App installable sur telephone (PWA) : valeurs lues par app/manifest.js.
// Pas de service worker : aucune page ni aucun script mis en cache (une version
// perimee du site pourrait casser les transactions). Le manifeste suffit pour
// « Ajouter a l'ecran d'accueil » sur Chrome et Android.
// Couleur de fond : --bg-main de app/globals.css.
export const PWA = {
  name: 'JoobEscrow',
  shortName: 'JoobEscrow',
  description: 'Non-custodial escrow on BNB Chain. Pay someone or get paid safely.',
  startUrl: '/app',
  scope: '/',
  display: 'standalone',
  backgroundColor: '#0a0a0a',
  themeColor: '#0a0a0a',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
