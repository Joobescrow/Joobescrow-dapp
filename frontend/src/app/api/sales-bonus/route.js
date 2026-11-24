import { ROUTE_READ_TIMEOUT_MS } from '../../../config/presale';
import { firstProvider, fairShare, ARCHIVE_RPCS } from '../../../lib/presaleLogs';
import { SALES_BONUS } from '../../../config/promo';

// Beneficiaires du bonus Fair Share, calcules cote serveur, cache 10 minutes (src/lib/presaleLogs.js).
export const revalidate = 600;
export const maxDuration = 60;

export async function GET() {
  try {
    // Lecture plafonnee : au-dela du delai, reponse de secours (voir config/presale.js).
    const read = (async () => {
      const p = await firstProvider(ARCHIVE_RPCS(), { 'User-Agent': 'JoobEscrow-site/1.0' });
      return fairShare(p);
    })();
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('read timeout')), ROUTE_READ_TIMEOUT_MS); });
    try {
      return Response.json(await Promise.race([read, timeout]));
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.error('[sales-bonus]', err?.shortMessage || err?.message || err);
    const started = Date.now() / 1000 >= Date.parse(SALES_BONUS.start) / 1000;
    return Response.json({ campaign: SALES_BONUS.name, entries: [], started, error: 'unavailable' });
  }
}
