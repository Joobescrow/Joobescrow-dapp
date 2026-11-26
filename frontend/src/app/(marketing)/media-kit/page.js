import { MEDIA_KIT } from '../../../config/mediaKit';
import { BSCSCAN } from '../../../config/presale';

export const metadata = {
  title: 'Media Kit | JoobEscrow',
  description: 'Official JoobEscrow logos, banners, colors, links and contract addresses for partners and media.',
  alternates: { canonical: '/media-kit' },
};

const card = 'glass-panel p-6';
// Mise en page en styles directs : toutes les classes utilitaires n'existent pas sur ce site.
const grid = (min) => ({ display: 'grid', gap: 16, gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` });
const thumb = { display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, height: 128, padding: 12 };
const thumbImg = { maxHeight: 96, maxWidth: '100%', objectFit: 'contain', display: 'block' };
const fileBtn = 'inline-block mt-3 text-sm font-bold text-lime-400 hover:underline';

export default function MediaKitPage() {
  const k = MEDIA_KIT;
  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Media <span className="text-gradient">Kit</span></h1>
        <p className="text-gray-400 text-lg">Official files and information for partners and media.</p>
        <a href={k.zip} download className="btn btn-primary mt-6 inline-flex items-center justify-center">Download the full kit (.zip)</a>
      </div>

      {/* Encart anti-arnaque : la page sert aussi de reference pour verifier un lien ou une adresse */}
      <div className="glass-panel p-6 mb-8" style={{ border: '1px solid rgba(163, 230, 53, 0.45)', background: 'rgba(163, 230, 53, 0.06)' }}>
        <h2 className="text-lg font-bold text-lime-300 mb-2">Verify before you trust</h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          The links and contract addresses on this page are the only official ones. JoobEscrow never DMs first, never asks for your seed phrase or private key,
          and never asks you to connect a wallet in Telegram. Any other channel, site or address using our name is fake.
        </p>
      </div>

      <section className={`${card} mb-8`}>
        <h2 className="text-xl font-bold text-white mb-3">About JoobEscrow</h2>
        <p className="text-gray-300">{k.description}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Logos</h2>
        <div style={grid(200)}>
          {k.logos.map((f) => (
            <div key={f.file} className={card}>
              <div style={{ ...thumb, background: f.dark ? '#05080A' : 'rgba(255,255,255,0.04)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.file} alt={f.label} style={thumbImg} />
              </div>
              <p className="text-sm text-white mt-3">{f.label}</p>
              <p className="text-xs text-gray-500">{f.size}</p>
              <a href={f.file} download className={fileBtn}>Download</a>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Banners</h2>
        <div style={grid(260)}>
          {k.banners.map((f) => (
            <div key={f.file} className={card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.file} alt={f.label} style={{ width: '100%', height: 'auto', borderRadius: 10, display: 'block' }} />
              <p className="text-sm text-white mt-3">{f.label}</p>
              <p className="text-xs text-gray-500">{f.size}</p>
              <a href={f.file} download className={fileBtn}>Download</a>
            </div>
          ))}
        </div>
      </section>

      <section className={`${card} mb-8`}>
        <h2 className="text-xl font-bold text-white mb-4">Colors</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {k.colors.map((c) => (
            <div key={c.hex} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-block', width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: c.hex }} />
              <span className="text-sm text-gray-300">{c.name}<br /><code className="text-white">{c.hex}</code></span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${card} mb-8`}>
        <h2 className="text-xl font-bold text-white mb-4">Official links</h2>
        <ul className="space-y-2">
          {k.links.map((l) => (
            <li key={l.href} className="text-sm" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-gray-400">{l.label}</span>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">{l.text}</a>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} mb-8`}>
        <h2 className="text-xl font-bold text-white mb-1">Official contracts (BNB Chain)</h2>
        <p className="text-gray-500 text-sm mb-4">Always compare the full address, not only the first and last characters.</p>
        <ul className="space-y-3">
          {k.contracts.map((c) => (
            <li key={c.address} className="text-sm" style={{ paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-gray-400 block">{c.label}</span>
              <a href={`${BSCSCAN}/address/${c.address}`} target="_blank" rel="noopener noreferrer" className="text-white font-mono hover:text-lime-400" style={{ overflowWrap: 'anywhere' }}>{c.address} ↗</a>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-xl font-bold text-white mb-3">Usage rules</h2>
        <ul className="list-disc pl-6 text-gray-300 space-y-1">
          {k.rules.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </section>
    </div>
  );
}
