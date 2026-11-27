/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/kol/:handle',
        destination: '/influence/kol/:handle',
        permanent: true,
      },
      // Contracts et Disputes remplaces par « My escrows » (liste unique, tous contrats).
      { source: '/:niche/contracts', destination: '/:niche/all', permanent: false },
      { source: '/:niche/disputes', destination: '/:niche/all', permanent: false },
      // Lien KOL court : joobescrow.com/r/<handle> -> /app?ref=<handle> (le suivi ?ref existant prend le relais).
      { source: '/r/:handle', destination: '/app?ref=:handle', permanent: false },
      // Lien KOL presale : joobescrow.com/p/<handle> -> /presale?ref=<handle> (meme flag, parrain = wallet de parrainage du KOL).
      { source: '/p/:handle', destination: '/presale?ref=:handle', permanent: false },
    ];
  },
};

export default nextConfig;
