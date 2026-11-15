'use client';

// Enregistrement d'une preuve de litige on-chain (submitEvidence du contrat V4), partage par le chat
// et l'onglet Files. Une transaction signee par la partie : c'est ce qui prouve qui a presente le fichier.
import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useToast } from '../context/ToastContext';
import { useEscrowContract } from './useEscrowContract';
import { isUserRejection, walletErrorMessage } from '../lib/walletErrors';

export function useRecordEvidence(escrowAddr, escrowId, onRecorded) {
  const { ensureCorrectChain } = useWeb3();
  const { showToast } = useToast();
  const contract = useEscrowContract(escrowAddr);
  const [recording, setRecording] = useState(null);

  /** Enregistre l'empreinte `hash` (bytes32) ; `label` sert aux messages. Renvoie true si c'est fait. */
  const record = async (hash, label) => {
    if (!contract || escrowId == null) return false;
    setRecording(hash);
    try {
      await ensureCorrectChain();
      const tx = await contract.submitEvidence(escrowId, hash);
      showToast('success', 'Evidence transaction sent…');
      await tx.wait();
      showToast('success', `${label} recorded on-chain as evidence.`);
      if (onRecorded) onRecorded();
      return true;
    } catch (err) {
      console.error('[Evidence] record:', err);
      if (!isUserRejection(err)) showToast('error', `Recording failed: ${walletErrorMessage(err)}`);
      return false;
    } finally {
      setRecording(null);
    }
  };

  return { record, recording };
}
