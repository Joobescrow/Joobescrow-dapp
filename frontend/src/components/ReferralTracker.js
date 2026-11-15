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

    // Hors lien de paiement, ?ref= reste stocke tel quel (comportement d'origine, evenement Analytics).
    const referral = kolParam || (!isPayLink ? refParam : null);
    if (!referral) return;
    try {
      localStorage.setItem('joob_ref', referral);
      // Flag KOL : clic horodate sous une cle distincte, seulement pour un handle valide et actif
      // (un handle inconnu n'ecrase pas un clic valide precedent).
      const kolClick = kolClickValue(referral, kolProgram);
      if (kolClick) localStorage.setItem(KOL_STORAGE_KEY, kolClick);
    } catch {}
  }, [searchParams]);

  // This component doesn't render anything visually
  return null;
}
