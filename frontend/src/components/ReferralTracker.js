'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { kolClickValue, KOL_STORAGE_KEY } from '../lib/kolFlag';
import kolProgram from '../config/kolProgram.json';

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Liens de paiement (?pay=...) : le parametre 'ref' est la reference de transaction
    // (grave sur le contrat via JOOBREF), pas un code de parrainage.
    // L'attribution KOL passe alors par 'kol', ou conserve le clic precedent en localStorage.
    const isPayLink = searchParams.has('pay');
    const kolParam = searchParams.get('kol');
    const refParam = searchParams.get('ref');

    const candidateKol = kolParam || (!isPayLink ? refParam : null);
    if (candidateKol) {
      try {
        const kolClick = kolClickValue(candidateKol, kolProgram);
        if (kolClick) {
          localStorage.setItem('joob_ref', candidateKol);
          localStorage.setItem(KOL_STORAGE_KEY, kolClick);
        }
      } catch {}
    } else if (!isPayLink && refParam) {
      // Store standard non-KOL referral in localStorage
      localStorage.setItem('joob_ref', refParam);
    }
  }, [searchParams]);

  // This component doesn't render anything visually
  return null;
}
