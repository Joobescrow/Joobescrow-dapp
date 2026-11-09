// Wallets mis en avant dans la fenetre de connexion Reown, dans cet ordre (decision du 08/11/2026).
// IDs du registre WalletConnect (explorer-api.walletconnect.com, recherche du 08/11/2026).
// Les wallets detectes dans le navigateur (extensions) restent affiches en premier par Reown.
export const FEATURED_WALLETS = [
  { name: 'MetaMask', id: 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96' },
  { name: 'Rabby', id: '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1' },
  { name: 'Trust Wallet', id: '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0' },
  { name: 'Binance Wallet', id: '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4' },
  { name: 'OKX Wallet', id: '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709' },
  { name: 'SafePal', id: '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150' },
  { name: 'TokenPocket', id: '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66' },
  { name: 'Bitget Wallet', id: '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662' },
];

export const FEATURED_WALLET_IDS = FEATURED_WALLETS.map((w) => w.id);
