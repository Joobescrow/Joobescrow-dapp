import { ROUTE_READ_TIMEOUT_MS } from '../../../config/presale';
import { firstProvider, recentBuys, SERVER_RPCS } from '../../../lib/presaleLogs';

// Derniers achats de la presale, lus cote serveur et mis en cache 5 minutes (src/lib/presaleLogs.js).
export const revalidate = 300;
export const maxDuration = 60;

export async function GET() {
  try {
    // Lecture plafonnee : au-dela du delai, reponse de secours (voir config/presale.js).
    const read = (async () => {
      const p = await firstProvider(SERVER_RPCS(), { 'User-Agent': 'JoobEscrow-site/1.0' });
      return { buys: await recentBuys(p), updatedAt: Math.floor(Date.now() / 1000) };
    })();
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('read timeout')), ROUTE_READ_TIMEOUT_MS); });
    try {
      return Response.json(await Promise.race([read, timeout]));
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.error('[recent-buys]', err?.shortMessage || err?.message || err);
    return Response.json({ buys: [], error: 'unavailable' });
  }
}
