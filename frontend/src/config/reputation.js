// Profil de reputation public (/u/<adresse>) : lecture des escrows des contrats payants (demo exclue).
import { PAID_CONTRACTS } from './feeTiers';
import { PAY_SOMEONE_CATEGORY } from './appEntry';

export const REPUTATION = {
  contracts: PAID_CONTRACTS, // 5 %, 3 %, 2 % et les deux anciens contrats ; la demo n'est jamais comptee
  concurrency: 6, // lectures en parallele par contrat
  cacheKey: 'joobRep1', // cache local des escrows termines (statut definitif)
  dealCategory: PAY_SOMEONE_CATEGORY, // categorie des liens /deal (vocabulaire seulement)
  path: (address) => `/u/${address}`,
};
