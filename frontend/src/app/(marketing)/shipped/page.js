import Link from 'next/link';
import { SHIPPED, PRESS } from '../../../config/shipped';
import styles from './shipped.module.css';

export const metadata = {
  title: 'What we shipped | JoobEscrow',
  description: 'Everything live in JoobEscrow today, date by date: payment links, pay button, encrypted files, on-chain evidence, receipts and reputation profiles.',
  alternates: { canonical: '/shipped' },
};

const fmt = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export default function ShippedPage() {
  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>SHIPPED, NOT ANNOUNCED</p>
      <h1 className={styles.title}>What we <span className={styles.grad}>shipped</span></h1>
      <p className={styles.lead}>
        Everything on this page is live and usable today. Each line links to the feature, so you can check it yourself.
      </p>

      <ol className={styles.list}>
        {SHIPPED.map((s) => (
          <li key={`${s.date}-${s.title}`} className={styles.item}>
            <span className={styles.date}>{fmt(s.date)}</span>
            <div>
              <h2>{s.title}</h2>
              <p>{s.desc}</p>
              <Link href={s.href} className={styles.cta}>{s.cta} <span aria-hidden="true">→</span></Link>
            </div>
          </li>
        ))}
      </ol>

      <h2 className={styles.h2}>In the press</h2>
      <ul className={styles.press}>
        {PRESS.map((p) => (
          <li key={p.href}>
            <a href={p.href} target="_blank" rel="noopener noreferrer"><b>{p.outlet}</b> · {p.title} ↗</a>
          </li>
        ))}
      </ul>

      <p className={styles.next}>
        Coming next: personal Telegram alerts for your escrows. See the <Link href="/roadmap">roadmap</Link>.
      </p>
    </div>
  );
}
