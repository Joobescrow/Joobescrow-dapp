'use client';

// Entree « Pay someone » de /app : le type de deal se choisit ici, dans une liste (comme dans « Get paid »),
// puis le bouton ouvre directement le formulaire de creation dans cette categorie.
import { useState } from 'react';
import Link from 'next/link';
import { instances } from '../../../config/instances';
import { PAY_SOMEONE_CATEGORY, OPEN_CREATE_PARAM } from '../../../config/appEntry';
import styles from './hub.module.css';

const TYPES = Object.values(instances).filter((n) => !n.isDemo);

export default function PaySomeoneDoor() {
  const [slug, setSlug] = useState(PAY_SOMEONE_CATEGORY);
  return (
    <div className={`${styles.door} ${styles.doorPay}`}>
      <span className={styles.doorEyebrow}>I am paying</span>
      <h2>Pay someone</h2>
      <p>Lock the payment in escrow and release it when the work is delivered. 0% fee for you.</p>
      <label className={styles.doorLabel} htmlFor="pay-someone-type">Type of deal</label>
      <select id="pay-someone-type" className={styles.doorSelect} value={slug} onChange={(e) => setSlug(e.target.value)}>
        {TYPES.map((n) => (
          <option key={n.slug} value={n.slug}>
            {n.name} ({n.lexicon.client} pays, {n.lexicon.provider} gets paid)
          </option>
        ))}
      </select>
      <span className={styles.doorHint}>Only changes the words used. Fees are the same for every type.</span>
      <Link href={`/${slug}?${OPEN_CREATE_PARAM}=1`} className={styles.doorCta}>
        Start an escrow <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
