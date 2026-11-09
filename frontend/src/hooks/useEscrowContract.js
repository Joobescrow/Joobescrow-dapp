import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { useNiche } from '../context/NicheContext';
import { ESCROW_ABI } from '../config/contract';

// Contrat signe pour les actions sur un escrow. `address` = contrat reel de l'escrow
// (grille par montant : il peut differer du contrat de la categorie) ; sinon contrat de la niche.
export function useEscrowContract(address) {
  const { signer } = useWeb3();
  const niche = useNiche();
  const contractAddress = address || niche?.contractAddress;

  const contract = useMemo(() => {
    if (!signer || !contractAddress) return null;
    return new ethers.Contract(contractAddress, ESCROW_ABI, signer);
  }, [signer, contractAddress]);

  return contract;
}
