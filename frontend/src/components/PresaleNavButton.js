'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import styles from '../app/(marketing)/marketing.module.css';

// Ouverture de la vente : startTime() du contrat presale (15/10/2026 14:00 UTC).
const PRESALE_START_MS = 1792072800 * 1000;

const noopSubscribe = () => () => {};
const isOpen = () => Date.now() >= PRESALE_START_MS;

export default function PresaleNavButton() {
  // Meme calcul cote serveur et client : la page est generee apres l'ouverture, donc « Open » des le HTML.
  const open = useSyncExternalStore(noopSubscribe, isOpen, isOpen);
  return (
    <Link href="/presale" className={styles.presaleBtn}>
      <span className={styles.presaleDot} />
      JOOB Presale
      <span className={styles.presaleTag}>{open ? 'Open' : 'Oct 15'}</span>
    </Link>
  );
}
