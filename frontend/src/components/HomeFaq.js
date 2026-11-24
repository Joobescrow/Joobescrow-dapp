'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HOME_FAQ } from '../config/faq';
import styles from './HomeFaq.module.css';

export default function HomeFaq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        {HOME_FAQ.map((f, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={f.q}
              className={`glass-panel ${styles.item} ${isOpen ? styles.itemOpen : ''}`}
              onClick={() => setOpenIdx(isOpen ? -1 : idx)}
            >
              <div className={styles.question}>
                <span>{f.q}</span>
                <span className={styles.toggleIcon}>{isOpen ? '−' : '+'}</span>
              </div>
              {isOpen && (
                <p className={styles.answer}>
                  {f.summary}{' '}
                  <Link href={f.href} onClick={(e) => e.stopPropagation()} className="text-gradient font-bold hover:underline">Read more →</Link>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', margin: '18px 0 0' }}>
        <Link href="/faq" className="text-gradient font-bold hover:underline">Read all questions →</Link>
      </p>
    </div>
  );
}
